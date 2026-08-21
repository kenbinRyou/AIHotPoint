// db/stories.js
// 故事线（Story）：同一事件的多源报道聚合
import { getDb } from './sqlite.js';
import { logger } from '../utils/logger.js';
import { getStoryItems, itemHeat } from './items.js';
import { storyDigest } from '../ai/bailian.js';

const STORY_WINDOW_MS = 48 * 3600 * 1000; // 活跃故事窗口：48h 内可继续归入
const SIM_THRESHOLD = 0.34;               // bigram Jaccard 相似度阈值

// ---------------------------------------------------------------------------
// 文本相似度：字符 bigram + Jaccard（中英文通用，无需分词）
function bigrams(s) {
  const t = String(s || '').toLowerCase().replace(/\s+/g, '');
  const set = new Set();
  for (let i = 0; i < t.length - 1; i++) set.add(t.slice(i, i + 2));
  return set;
}

function jaccard(a, b) {
  if (!a.size || !b.size) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  return inter / (a.size + b.size - inter);
}

// ---------------------------------------------------------------------------
/** 活跃故事缓存（标题/成员标题的 bigram），进程内缓存避免每条都查库 */
let activeCache = null;
function getActiveStories() {
  const db = getDb();
  const since = Date.now() - STORY_WINDOW_MS;
  const stories = db
    .prepare('SELECT * FROM stories WHERE last_seen >= ? ORDER BY last_seen DESC')
    .all(since);
  if (!activeCache) activeCache = new Map();
  return stories.map((s) => {
    if (!activeCache.has(s.id)) {
      const titles = db
        .prepare('SELECT title FROM items WHERE story_id = ?')
        .all(s.id)
        .map((r) => r.title);
      activeCache.set(s.id, {
        story: s,
        titleBigram: bigrams(s.title),
        memberTitles: titles,
        memberBigrams: titles.map(bigrams),
      });
    }
    return activeCache.get(s.id);
  });
}

function invalidateCache() {
  activeCache = null;
}

/**
 * 把一条 item 归入故事线（或新建故事）。
 * @returns storyId
 */
export function assignStory(item) {
  const db = getDb();
  const now = Date.now();
  const t = bigrams(item.title);
  let best = null;
  let bestScore = 0;
  for (const c of getActiveStories()) {
    let score = jaccard(t, c.titleBigram);
    for (const mb of c.memberBigrams) {
      const v = jaccard(t, mb);
      if (v > score) score = v;
    }
    if (score > bestScore) { bestScore = score; best = c; }
  }

  if (best && bestScore >= SIM_THRESHOLD) {
    // 归入已有故事
    db.prepare('UPDATE items SET story_id = ? WHERE id = ?').run(best.story.id, item.id);
    best.memberTitles.push(item.title);
    best.memberBigrams.push(t);
    const heat = recomputeStoryHeat(best.story.id);
    db.prepare('UPDATE stories SET last_seen = ?, heat = ?, peak_heat = MAX(peak_heat, ?) WHERE id = ?')
      .run(now, heat, heat, best.story.id);
    return best.story.id;
  }

  // 新建故事
  const info = db
    .prepare('INSERT INTO stories (title, heat, peak_heat, item_count, first_seen, last_seen, created_at) VALUES (?, 0, 0, 0, ?, ?, ?)')
    .run(item.title, item.fetched_at || now, now, now);
  const storyId = Number(info.lastInsertRowid);
  db.prepare('UPDATE items SET story_id = ? WHERE id = ?').run(storyId, item.id);
  const heat = recomputeStoryHeat(storyId);
  db.prepare('UPDATE stories SET heat = ?, peak_heat = ?, item_count = 1 WHERE id = ?')
    .run(heat, heat, storyId);
  invalidateCache();
  return storyId;
}

/** 重算故事热度（成员 item 热度求和）与成员数 */
export function recomputeStoryHeat(storyId) {
  const db = getDb();
  const items = db
    .prepare("SELECT metrics_json, ai_score FROM items WHERE story_id = ?")
    .all(storyId);
  let heat = 0;
  for (const r of items) {
    heat += itemHeat({ metrics: JSON.parse(r.metrics_json || '{}'), ai_score: r.ai_score });
  }
  db.prepare('UPDATE stories SET heat = ?, item_count = ? WHERE id = ?')
    .run(heat, items.length, storyId);
  return heat;
}

// ---------------------------------------------------------------------------
/** 热点榜单：活跃故事按热度排序，附 24h 热度趋势与状态标签 */
export function listStories({ limit = 20, time_range = '48h' } = {}) {
  const db = getDb();
  const since = Date.now() - (time_range === 'all' ? Infinity : 48 * 3600 * 1000);
  const rows = db
    .prepare('SELECT * FROM stories WHERE last_seen >= ? ORDER BY heat DESC LIMIT ?')
    .all(since, limit);

  const snapStmt = db.prepare(
    'SELECT ts, heat FROM heat_snapshots WHERE story_id = ? AND ts >= ? ORDER BY ts ASC',
  );
  const topItemStmt = db.prepare(
    'SELECT source, fetched_at FROM items WHERE story_id = ? ORDER BY fetched_at ASC LIMIT 1',
  );
  const recentStmt = db.prepare(
    'SELECT COUNT(*) AS c FROM items WHERE story_id = ? AND fetched_at >= ?',
  );
  const sourcesStmt = db.prepare(
    'SELECT DISTINCT source FROM items WHERE story_id = ?',
  );

  return rows.map((s) => {
    const snaps = snapStmt.all(s.id, Date.now() - 24 * 3600 * 1000);
    const first = topItemStmt.get(s.id);
    const last3h = recentStmt.get(s.id, Date.now() - 3 * 3600 * 1000).c;
    const sources = sourcesStmt.all(s.id).map((r) => r.source);
    return {
      ...s,
      trend: snaps.map((x) => ({ ts: x.ts, heat: x.heat })),
      first_source: first?.source || null,
      first_seen: first?.fetched_at || s.first_seen,
      recent_count_3h: last3h,
      status: storyStatus(s, last3h),
      sources,
      source_count: sources.length,
    };
  });
}

/** 状态标签：爆（密集报道）/ 新（首报 6 小时内）/ 发酵中（信源仍在增加） */
function storyStatus(story, last3hCount) {
  const age = Date.now() - story.first_seen;
  if (story.item_count >= 4 && age < 24 * 3600 * 1000) return '爆';
  if (age < 6 * 3600 * 1000) return '新';
  if (last3hCount > 0) return '发酵中';
  return null;
}

/** 故事详情：综述 + 走势 + 报道时间线 */
export function getStory(id) {
  const db = getDb();
  const story = db.prepare('SELECT * FROM stories WHERE id = ?').get(id);
  if (!story) return null;
  const snaps = db
    .prepare('SELECT ts, heat FROM heat_snapshots WHERE story_id = ? AND ts >= ? ORDER BY ts ASC')
    .all(id, Date.now() - 24 * 3600 * 1000);
  const items = getStoryItems(id);
  const sourceList = [...new Set(items.map((it) => it.source))];
  return {
    ...story,
    trend: snaps.map((x) => ({ ts: x.ts, heat: x.heat })),
    items,
    sources: sourceList,
    source_count: sourceList.length,
    peak_at: snaps.length
      ? snaps.reduce((a, b) => (b.heat > a.heat ? b : a)).ts
      : null,
  };
}

/** 小时级热度采样：为全部活跃故事写一条快照 */
export function snapshotHeats() {
  const db = getDb();
  const since = Date.now() - STORY_WINDOW_MS;
  const stories = db.prepare('SELECT id FROM stories WHERE last_seen >= ?').all(since);
  const now = Date.now();
  const insert = db.prepare('INSERT INTO heat_snapshots (story_id, ts, heat) VALUES (?, ?, ?)');
  const tx = db.transaction(() => {
    for (const s of stories) {
      const heat = recomputeStoryHeat(s.id);
      insert.run(s.id, now, heat);
    }
  });
  tx();
  logger.info(`heat snapshot: ${stories.length} stories`, 'stories');
  return stories.length;
}

/**
 * 事件综述：故事成员 ≥2 且成员数有增长时生成/刷新 AI 综述
 */
export async function refreshStoryDigest(storyId) {
  const db = getDb();
  const story = db.prepare('SELECT * FROM stories WHERE id = ?').get(storyId);
  if (!story || story.item_count < 2) return;
  if (story.digest && story.digest_item_count >= story.item_count) return;
  const items = getStoryItems(storyId);
  const digest = await storyDigest(story, items);
  if (digest) {
    db.prepare('UPDATE stories SET digest = ?, digest_item_count = ? WHERE id = ?')
      .run(digest, story.item_count, storyId);
  }
}
