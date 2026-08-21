// db/items.js
// Item 仓储层
import { getDb } from './sqlite.js';
import { itemHash, timeRangeToSince, safeJson } from '../utils/hash.js';
import { isAiRelated, guessCategory, mapLegacyCategory } from '../utils/ai-relevance.js';

const INSERT_SQL = `
  INSERT OR IGNORE INTO items
  (source, external_id, url, title, content, author, lang, metrics_json,
   published_at, fetched_at, hash, matched_keywords_json, is_ai)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`;

const UPDATE_AI_SQL = `
  UPDATE items SET
    ai_importance = ?,
    ai_score = ?,
    ai_summary = ?,
    ai_category = ?,
    ai_keywords_json = ?,
    is_ai = ?
  WHERE id = ?
`;

/** 单条 item 综合热度（与 heat_desc 排序口径一致） */
export function itemHeat(it) {
  const m = it.metrics || {};
  return (m.likes || 0) + (m.shares || 0) * 2 + (m.views || 0) * 0.01 + (it.ai_score || 0) * 1000;
}

export function bulkInsert(rawItems, matchedKeywords = []) {
  const db = getDb();
  const stmt = db.prepare(INSERT_SQL);
  const now = Date.now();
  const inserted = [];
  const tx = db.transaction((rows) => {
    rows.forEach((r, i) => {
      const hash = itemHash(r.url, r.title);
      // 每个 item 用各自命中的关键词数组（按索引对齐）
      const matchedJson = JSON.stringify(matchedKeywords[i] || []);
      // AI 相关性：调用方显式标记优先，否则关键词判定
      const aiFlag = typeof r.is_ai === 'boolean' ? (r.is_ai ? 1 : 0) : (isAiRelated(r) ? 1 : 0);
      const info = stmt.run(
        r.source,
        r.external_id || null,
        r.url,
        r.title,
        r.content || null,
        r.author || null,
        r.lang || null,
        r.metrics ? JSON.stringify(r.metrics) : null,
        r.published_at || null,
        now,
        hash,
        matchedJson,
        aiFlag,
      );
      if (info.changes > 0) inserted.push({ id: Number(info.lastInsertRowid), is_ai: aiFlag, ...r });
    });
  });
  tx(rawItems);
  return inserted;
}

export function setAiResult(id, ai) {
  const db = getDb();
  db.prepare(UPDATE_AI_SQL).run(
    ai.importance || null,
    typeof ai.score === 'number' ? ai.score : null,
    ai.summary || null,
    ai.category || null,
    JSON.stringify(ai.keywords || []),
    typeof ai.is_ai === 'boolean' ? (ai.is_ai ? 1 : 0) : 1,
    id,
  );
}

/** 写入推荐理由（独立 AI 调用生成） */
export function setAiReason(id, reason) {
  const db = getDb();
  db.prepare('UPDATE items SET ai_reason = ? WHERE id = ?').run(reason, id);
}

/** 写入全文抓取与中文译文 */
export function setFullText(id, fullText, zh) {
  const db = getDb();
  db.prepare('UPDATE items SET full_text = ?, full_text_zh = ? WHERE id = ?').run(
    fullText || null,
    zh || null,
    id,
  );
}

export function listItems({
  sources = [],         // string[]
  importance = [],      // urgent/high/medium/low
  keyword = '',         // 用户关键词
  category = '',        // AI 分类（ai-models/ai-products/industry/paper/tip/opinion）
  time_range = '24h',   // 1h/6h/24h/48h/7d/all
  sort = 'fetched_desc',// fetched_desc / published_desc / score_desc / heat_desc / relevance_desc / importance_desc
  page = 1,
  pageSize = 20,
  is_ai = true,         // 默认只出 AI 相关内容；显式传 false 才包含全部
  ids = null,           // 指定 id 集合（主题页等场景）
} = {}) {
  const db = getDb();
  const conds = [];
  const params = [];

  if (is_ai !== false) {
    conds.push('is_ai = 1');
  }
  if (ids) {
    if (!ids.length) return { items: [], total: 0 };
    conds.push(`id IN (${ids.map(() => '?').join(',')})`);
    params.push(...ids);
  }
  if (sources.length) {
    conds.push(`source IN (${sources.map(() => '?').join(',')})`);
    params.push(...sources);
  }
  if (importance.length) {
    conds.push(`ai_importance IN (${importance.map(() => '?').join(',')})`);
    params.push(...importance);
  }
  if (category) {
    conds.push('ai_category = ?');
    params.push(String(category));
  }
  if (keyword) {
    conds.push('(title LIKE ? OR content LIKE ? OR ai_summary LIKE ? OR matched_keywords_json LIKE ? OR ai_keywords_json LIKE ?)');
    const k = `%${keyword}%`;
    params.push(k, k, k, k, k);
  }
  if (time_range && time_range !== 'all') {
    conds.push('fetched_at >= ?');
    params.push(timeRangeToSince(time_range));
  }

  const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';

  let orderBy = 'fetched_at DESC';
  switch (sort) {
    case 'published_desc': orderBy = 'published_at DESC'; break;
    case 'fetched_desc':   orderBy = 'fetched_at DESC'; break;
    case 'score_desc':     orderBy = 'COALESCE(ai_score, 0) DESC, fetched_at DESC'; break;
    case 'importance_desc':
      orderBy = `CASE ai_importance
        WHEN 'urgent' THEN 4 WHEN 'high' THEN 3 WHEN 'medium' THEN 2 WHEN 'low' THEN 1
        ELSE 0 END DESC, fetched_at DESC`;
      break;
    case 'heat_desc':
      // 综合点赞+转发+浏览
      orderBy = `COALESCE(json_extract(metrics_json, '$.likes'),0)
               + COALESCE(json_extract(metrics_json, '$.shares'),0)*2
               + COALESCE(json_extract(metrics_json, '$.views'),0)*0.01
               + COALESCE(ai_score,0)*1000 DESC, fetched_at DESC`;
      break;
    default: orderBy = 'fetched_at DESC';
  }

  const total = db.prepare(`SELECT COUNT(*) AS c FROM items ${where}`).get(...params).c;
  const rows = db
    .prepare(`SELECT * FROM items ${where} ORDER BY ${orderBy} LIMIT ? OFFSET ?`)
    .all(...params, pageSize, (page - 1) * pageSize);

  // 解析 JSON 字段
  const items = rows.map((r) => ({
    ...r,
    metrics: safeJson(r.metrics_json, {}),
    ai_keywords: safeJson(r.ai_keywords_json, []),
    matched_keywords: safeJson(r.matched_keywords_json, []),
    dup_count: 0,
    dup_sources: [],
  }));

  // 同故事线的其余信源（对齐目标站「另有 N 家信源报道」）
  const storyIds = [...new Set(items.map((i) => i.story_id).filter((v) => v != null))];
  if (storyIds.length) {
    const ph = storyIds.map(() => '?').join(',');
    const groupRows = db
      .prepare(`SELECT id, story_id, source FROM items WHERE story_id IN (${ph})`)
      .all(...storyIds);
    const byStory = {};
    groupRows.forEach((r) => {
      (byStory[r.story_id] ||= []).push(r);
    });
    items.forEach((it) => {
      if (it.story_id == null) return;
      const group = byStory[it.story_id] || [];
      const others = group.filter((r) => r.id !== it.id);
      const sources = [...new Set(others.map((r) => r.source))];
      it.dup_count = others.length;
      it.dup_sources = sources;
    });
  }

  return { items, total };
}

export function getItemById(id) {
  const db = getDb();
  const r = db.prepare('SELECT * FROM items WHERE id = ?').get(id);
  if (!r) return null;
  return {
    ...r,
    metrics: safeJson(r.metrics_json, {}),
    ai_keywords: safeJson(r.ai_keywords_json, []),
    matched_keywords: safeJson(r.matched_keywords_json, []),
  };
}

/** 按 id 集合批量取条目（日报/周报/月报渲染用，不做 dup 计算） */
export function getItemsByIds(ids) {
  if (!ids || !ids.length) return [];
  const db = getDb();
  const rows = db
    .prepare(`SELECT * FROM items WHERE id IN (${ids.map(() => '?').join(',')})`)
    .all(...ids);
  return rows.map(parseItem);
}

/** 某故事线下的全部报道（新→旧） */
export function getStoryItems(storyId) {
  const db = getDb();
  const rows = db
    .prepare('SELECT * FROM items WHERE story_id = ? ORDER BY fetched_at DESC')
    .all(storyId);
  return rows.map(parseItem);
}

/** 存量回填：遍历全部条目（含非 AI） */
export function iterAllItems(chunk = 500) {
  const db = getDb();
  const total = db.prepare('SELECT COUNT(*) AS c FROM items').get().c;
  const out = [];
  for (let off = 0; off < total; off += chunk) {
    out.push(...db.prepare('SELECT * FROM items ORDER BY id LIMIT ? OFFSET ?').all(chunk, off).map(parseItem));
  }
  return out;
}

/** 存量回填：写回 is_ai / 新分类 / story_id */
export function updateBackfill(id, patch) {
  const db = getDb();
  const sets = [];
  const params = [];
  if (typeof patch.is_ai === 'number') { sets.push('is_ai = ?'); params.push(patch.is_ai); }
  if (patch.ai_category) { sets.push('ai_category = ?'); params.push(patch.ai_category); }
  if (patch.story_id !== undefined) { sets.push('story_id = ?'); params.push(patch.story_id); }
  if (!sets.length) return;
  db.prepare(`UPDATE items SET ${sets.join(', ')} WHERE id = ?`).run(...params, id);
}

/** 按旧分类猜测新分类（回填用）：关键词命中优先，否则旧值映射，最后 industry */
export function backfillCategory(item) {
  const guessed = guessCategory(item);
  if (guessed) return guessed;
  return mapLegacyCategory(item.ai_category) || 'industry';
}

function parseItem(r) {
  return {
    ...r,
    metrics: safeJson(r.metrics_json, {}),
    ai_keywords: safeJson(r.ai_keywords_json, []),
    matched_keywords: safeJson(r.matched_keywords_json, []),
  };
}

export function findPendingAi(limit = 20) {
  const db = getDb();
  return db
    .prepare(`SELECT * FROM items WHERE ai_summary IS NULL ORDER BY id DESC LIMIT ?`)
    .all(limit);
}

export function getKeywords() {
  const db = getDb();
  return db.prepare('SELECT * FROM keywords ORDER BY id DESC').all();
}

export function addKeyword(keyword) {
  const db = getDb();
  const k = String(keyword || '').trim();
  if (!k) return null;
  try {
    const info = db
      .prepare('INSERT INTO keywords (keyword, enabled, created_at) VALUES (?, 1, ?)')
      .run(k, Date.now());
    return { id: info.lastInsertRowid, keyword: k, enabled: 1 };
  } catch {
    return null;
  }
}

export function deleteKeyword(id) {
  const db = getDb();
  return db.prepare('DELETE FROM keywords WHERE id = ?').run(id).changes;
}

export function logCrawl(row) {
  const db = getDb();
  db.prepare(
    `INSERT INTO crawl_logs (source, started_at, finished_at, fetched_count, inserted_count, status, error)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    row.source,
    row.started_at,
    row.finished_at,
    row.fetched_count || 0,
    row.inserted_count || 0,
    row.status || 'ok',
    row.error || null,
  );
}

export function stats() {
  const db = getDb();
  const total = db.prepare('SELECT COUNT(*) AS c FROM items').get().c;
  const bySource = db.prepare('SELECT source, COUNT(*) AS c FROM items GROUP BY source').all();
  const byImportance = db
    .prepare('SELECT ai_importance AS k, COUNT(*) AS c FROM items GROUP BY ai_importance')
    .all();
  const last24h = db
    .prepare('SELECT COUNT(*) AS c FROM items WHERE fetched_at >= ?')
    .get(Date.now() - 24 * 3600 * 1000).c;
  return { total, bySource, byImportance, last24h };
}
