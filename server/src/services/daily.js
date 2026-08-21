// services/daily.js
// AI 日报：按天从当日 AI 相关重点内容生成，懒生成 + 归档
// 结构化：stats（四指标）+ sections（五栏目分组）
import { getDb } from '../db/sqlite.js';
import { dailyDigest } from '../ai/bailian.js';
import { getItemsByIds } from '../db/items.js';
import { safeJson } from '../utils/hash.js';
import { logger } from '../utils/logger.js';

function dateKey(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function dayRange(date) {
  const [y, m, d] = date.split('-').map(Number);
  const start = new Date(y, m - 1, d, 0, 0, 0).getTime();
  return { start, end: start + 24 * 3600 * 1000 };
}

function parse(it) {
  return {
    ...it,
    metrics: safeJson(it.metrics_json, {}),
    ai_keywords: safeJson(it.ai_keywords_json, []),
    matched_keywords: safeJson(it.matched_keywords_json, []),
  };
}

// 五栏目（对齐目标站日报结构）
const SECTIONS = [
  { key: 'ai-models', label: '模型发布 / 更新' },
  { key: 'ai-products', label: '产品发布 / 更新' },
  { key: 'industry', label: '行业动态' },
  { key: 'paper', label: '论文研究' },
  { key: 'tip+opinion', label: '技巧与观点' },
];

/** 当日全部 AI 相关条目（按 AI 评分 + 时间排序） */
function dayItems(date) {
  const db = getDb();
  const { start, end } = dayRange(date);
  const rows = db
    .prepare(
      `SELECT * FROM items
       WHERE is_ai = 1 AND fetched_at >= ? AND fetched_at < ?
       ORDER BY COALESCE(ai_score, 0) DESC, fetched_at DESC`,
    )
    .all(start, end);
  return rows.map(parse);
}

function volOf(date) {
  return `VOL.${date.replace(/-/g, '.')}`;
}

/** 将 DB 行水合为前端所需的结构化对象 */
function hydrate(row) {
  let sectionsRaw = [];
  try {
    sectionsRaw = JSON.parse(row.sections_json || '[]');
  } catch {}
  const sections = sectionsRaw.map((s) => ({
    key: s.key,
    label: s.label,
    count: s.count ?? (s.item_ids || []).length,
    items: getItemsByIds(s.item_ids || []),
  }));
  let stats = {};
  try {
    stats = JSON.parse(row.stats_json || '{}');
  } catch {}
  const storyCount = sections.reduce((n, s) => n + s.items.length, 0);
  return {
    date: row.date,
    vol: volOf(row.date),
    title: row.title || 'AI 日报',
    intro: row.intro || '',
    stats,
    sections,
    storyCount,
    readMinutes: Math.max(1, Math.round(storyCount * 0.4)),
  };
}

/**
 * 获取（必要时生成）某天的日报（结构化）
 * 注意：当天的报告允许过期重生成（数据全天持续入库）；历史日期纯缓存
 */
export async function getOrGenerateDaily(date) {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM daily_reports WHERE date = ?').get(date);
  const isToday = date === dateKey();
  const staleMs = 30 * 60 * 1000; // 当天报告 30 分钟后视为过期，重新生成
  const stale = isToday && existing && Date.now() - (existing.generated_at || 0) > staleMs;
  if (existing && existing.sections_json && !stale) {
    return hydrate(existing);
  }

  const items = dayItems(date);
  if (!items.length) return null;

  const llm = await dailyDigest(date, items).catch(() => null);
  const title = llm?.title || items[0].title.slice(0, 30);
  const intro =
    llm?.intro || `今日共精选 ${items.length} 条 AI 相关重点内容，涵盖模型、产品、行业与研究。`;

  // 按栏目分组
  const grouped = {};
  items.forEach((it) => {
    let key = it.ai_category || 'industry';
    if (key === 'tip' || key === 'opinion') key = 'tip+opinion';
    (grouped[key] ||= []).push(it);
  });
  const sections = SECTIONS.map((s) => ({
    key: s.key,
    label: s.label,
    count: (grouped[s.key] || []).length,
    item_ids: (grouped[s.key] || []).map((i) => i.id),
  })).filter((s) => s.count > 0);

  // 四指标统计
  const events = items.length;
  const firstHand = new Set(items.map((i) => i.story_id).filter((v) => v != null)).size || events;
  const newModels = (grouped['ai-models'] || []).length;
  const sources = new Set(items.map((i) => i.source)).size;
  const stats = { events, firstHand, newModels, sources };

  // 兼容旧字段：扁平正文
  const content =
    `${intro}\n\n` +
    sections
      .map(
        (s) =>
          `## ${s.label}\n` +
          grouped[s.key]
            .map((it, i) => `${i + 1}. ${it.title}（${it.source}）`)
            .join('\n'),
      )
      .join('\n\n');

  db.prepare(
    `INSERT OR REPLACE INTO daily_reports
       (date, title, content, intro, stats_json, sections_json, item_ids_json, generated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    date,
    title,
    content,
    intro,
    JSON.stringify(stats),
    JSON.stringify(sections),
    JSON.stringify(items.map((i) => i.id)),
    Date.now(),
  );
  logger.info(`daily report generated: ${date} (${events} items, ${sections.length} sections)`, 'daily');
  return { ...hydrate({ ...existing, date, title, intro, stats_json: JSON.stringify(stats), sections_json: JSON.stringify(sections) }), generated: true };
}

/** 日报归档列表（新→旧） */
export function listDaily(limit = 180) {
  const db = getDb();
  return db
    .prepare('SELECT date, title, generated_at FROM daily_reports ORDER BY date DESC LIMIT ?')
    .all(limit);
}

export { dateKey };
