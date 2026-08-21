// services/reports.js
// AI 周报 / 月报：按周期从 AI 相关重点内容生成（结构化 sections + stats）
import { getDb } from '../db/sqlite.js';
import { reportDigest } from '../ai/bailian.js';
import { getItemsByIds } from '../db/items.js';
import { safeJson } from '../utils/hash.js';
import { logger } from '../utils/logger.js';

// 五栏目（与日报一致，作为主题分节的确定性分组）
const SECTIONS = [
  { key: 'ai-models', label: '模型发布 / 更新' },
  { key: 'ai-products', label: '产品发布 / 更新' },
  { key: 'industry', label: '行业动态' },
  { key: 'paper', label: '论文研究' },
  { key: 'tip+opinion', label: '技巧与观点' },
];

function parse(it) {
  return {
    ...it,
    metrics: safeJson(it.metrics_json, {}),
    ai_keywords: safeJson(it.ai_keywords_json, []),
    matched_keywords: safeJson(it.matched_keywords_json, []),
  };
}

function isoWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - dayNum + 3);
  const firstThursday = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  const week =
    1 +
    Math.round(
      ((d - firstThursday) / 86400000 - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7,
    );
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

/** 周期内的全部 AI 相关条目 */
function periodItems(start, end) {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT * FROM items WHERE is_ai = 1 AND fetched_at >= ? AND fetched_at < ? ORDER BY COALESCE(ai_score,0) DESC, fetched_at DESC`,
    )
    .all(start, end);
  return rows.map(parse);
}

function buildSections(items) {
  const grouped = {};
  items.forEach((it) => {
    let key = it.ai_category || 'industry';
    if (key === 'tip' || key === 'opinion') key = 'tip+opinion';
    (grouped[key] ||= []).push(it);
  });
  return SECTIONS.map((s) => ({
    key: s.key,
    label: s.label,
    count: (grouped[s.key] || []).length,
    item_ids: (grouped[s.key] || []).map((i) => i.id),
  })).filter((s) => s.count > 0);
}

function buildStats(items, periodDays) {
  const events = items.length;
  const independent = new Set(items.map((i) => i.story_id).filter((v) => v != null)).size || events;
  const featured = items.filter((i) => ['urgent', 'high'].includes(i.ai_importance)).length;
  const sources = new Set(items.map((i) => i.source)).size;
  return {
    independent,
    featured,
    condensed: periodDays, // 期内天数（= 日报浓缩数）
    sources,
    readMinutes: Math.max(1, Math.round(events * 0.4)),
  };
}

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
  // 兼容旧字段：从 stats 取 readMinutes
  const storyCount = sections.reduce((n, s) => n + s.items.length, 0);
  return {
    issue: row.issue,
    title: row.title || '',
    intro: row.intro || '',
    stats: { ...stats, storyCount, readMinutes: stats.readMinutes || Math.max(1, Math.round(storyCount * 0.4)) },
    sections,
    storyCount,
  };
}

function currentIssue(kind) {
  const now = new Date();
  if (kind === 'weekly') return isoWeek(now);
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

async function generate(kind, issue, start, end, periodDays, periodLabel) {
  const db = getDb();
  const table = kind === 'weekly' ? 'weeklies' : 'monthlies';
  const existing = db.prepare(`SELECT * FROM ${table} WHERE issue = ?`).get(issue);
  // 当前期报告允许过期重生成（期内数据持续入库）；往期纯缓存
  const isCurrent = issue === currentIssue(kind);
  const staleMs = 2 * 3600 * 1000; // 当前期 2 小时后视为过期
  const stale = isCurrent && existing && Date.now() - (existing.generated_at || 0) > staleMs;
  if (existing && existing.sections_json && !stale) return hydrate(existing);

  const items = periodItems(start, end);
  if (!items.length) return null;

  const llm = await reportDigest({ periodLabel, kind }, items).catch(() => null);
  const title = llm?.title || `${periodLabel} AI 动态`;
  const intro =
    llm?.intro ||
    `${periodLabel} 共精选 ${items.length} 条 AI 相关重点内容，涵盖模型、产品、行业与研究等方向。`;

  const sections = buildSections(items);
  const stats = buildStats(items, periodDays);

  db.prepare(
    `INSERT OR REPLACE INTO ${table} (issue, period_start, period_end, title, intro, stats_json, sections_json, item_ids_json, generated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(issue, start, end, title, intro, JSON.stringify(stats), JSON.stringify(sections), JSON.stringify(items.map((i) => i.id)), Date.now());
  logger.info(`${kind} report generated: ${issue} (${items.length} items)`, kind);
  return { ...hydrate({ issue, title, intro, stats_json: JSON.stringify(stats), sections_json: JSON.stringify(sections) }), generated: true };
}

// 周期边界
function weekRange(d = new Date()) {
  const dt = new Date(d);
  const day = (dt.getDay() + 6) % 7; // 周一=0
  const monday = new Date(dt); monday.setDate(dt.getDate() - day); monday.setHours(0, 0, 0, 0);
  const next = new Date(monday); next.setDate(monday.getDate() + 7);
  return { start: monday.getTime(), end: next.getTime() };
}
function monthRange(d = new Date()) {
  const y = d.getFullYear(), m = d.getMonth();
  const start = new Date(y, m, 1, 0, 0, 0, 0).getTime();
  const end = new Date(y, m + 1, 1, 0, 0, 0, 0).getTime();
  return { start, end };
}

export async function getOrGenerateWeekly(issue) {
  let ish = issue;
  let range;
  if (!ish) {
    const now = new Date();
    ish = isoWeek(now);
    range = weekRange(now);
  } else {
    // 解析 2026-W34
    const m = /^(\d{4})-W(\d{2})$/.exec(ish);
    if (!m) return null;
    const year = Number(m[1]); const w = Number(m[2]);
    const jan4 = new Date(year, 0, 4);
    const monday = new Date(jan4);
    monday.setDate(jan4.getDate() - ((jan4.getDay() + 6) % 7) + (w - 1) * 7);
    monday.setHours(0, 0, 0, 0);
    const next = new Date(monday); next.setDate(monday.getDate() + 7);
    range = { start: monday.getTime(), end: next.getTime() };
  }
  return generate('weekly', ish, range.start, range.end, 7, `AIHOT ${ish}`);
}

export async function getOrGenerateMonthly(issue) {
  let ish = issue;
  let range;
  if (!ish) {
    const now = new Date();
    ish = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    range = monthRange(now);
  } else {
    const m = /^(\d{4})-(\d{2})$/.exec(ish);
    if (!m) return null;
    const year = Number(m[1]); const mo = Number(m[2]) - 1;
    range = monthRange(new Date(year, mo, 1));
  }
  const periodDays = Math.round((range.end - range.start) / 86400000);
  return generate('monthly', ish, range.start, range.end, periodDays, `AIHOT ${ish}`);
}

export function listWeekly(limit = 30) {
  const db = getDb();
  return db.prepare('SELECT issue, title, generated_at FROM weeklies ORDER BY issue DESC LIMIT ?').all(limit);
}
export function listMonthly(limit = 30) {
  const db = getDb();
  return db.prepare('SELECT issue, title, generated_at FROM monthlies ORDER BY issue DESC LIMIT ?').all(limit);
}
