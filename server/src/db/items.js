// db/items.js
// Item 仓储层
import { getDb } from './sqlite.js';
import { itemHash, timeRangeToSince, safeJson } from '../utils/hash.js';

const INSERT_SQL = `
  INSERT OR IGNORE INTO items
  (source, external_id, url, title, content, author, lang, metrics_json,
   published_at, fetched_at, hash, matched_keywords_json)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`;

const UPDATE_AI_SQL = `
  UPDATE items SET
    ai_importance = ?,
    ai_score = ?,
    ai_summary = ?,
    ai_category = ?,
    ai_keywords_json = ?
  WHERE id = ?
`;

export function bulkInsert(rawItems, matchedKeywords = []) {
  const db = getDb();
  const stmt = db.prepare(INSERT_SQL);
  const now = Date.now();
  let inserted = 0;
  const tx = db.transaction((rows) => {
    rows.forEach((r, i) => {
      const hash = itemHash(r.url, r.title);
      // 每个 item 用各自命中的关键词数组（按索引对齐）
      const matchedJson = JSON.stringify(matchedKeywords[i] || []);
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
      );
      if (info.changes > 0) inserted++;
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
    id,
  );
}

export function listItems({
  sources = [],         // string[]
  importance = [],      // urgent/high/medium/low
  keyword = '',         // 用户关键词
  time_range = '24h',   // 1h/6h/24h/7d/all
  sort = 'fetched_desc',// fetched_desc / published_desc / score_desc / heat_desc / relevance_desc / importance_desc
  page = 1,
  pageSize = 20,
} = {}) {
  const db = getDb();
  const conds = [];
  const params = [];

  if (sources.length) {
    conds.push(`source IN (${sources.map(() => '?').join(',')})`);
    params.push(...sources);
  }
  if (importance.length) {
    conds.push(`ai_importance IN (${importance.map(() => '?').join(',')})`);
    params.push(...importance);
  }
  if (keyword) {
    conds.push('(title LIKE ? OR content LIKE ? OR ai_summary LIKE ? OR matched_keywords_json LIKE ?)');
    const k = `%${keyword}%`;
    params.push(k, k, k, k);
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
  }));
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
