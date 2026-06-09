// db/migrate.js
import { getDb } from './sqlite.js';
import { logger } from '../utils/logger.js';

const MIGRATIONS = [
  {
    id: 1,
    name: 'init',
    sql: `
      CREATE TABLE IF NOT EXISTS items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        source TEXT NOT NULL,
        external_id TEXT,
        url TEXT NOT NULL,
        title TEXT NOT NULL,
        content TEXT,
        author TEXT,
        lang TEXT,
        metrics_json TEXT,
        published_at INTEGER,
        fetched_at INTEGER NOT NULL,
        ai_importance TEXT,
        ai_score REAL,
        ai_summary TEXT,
        ai_category TEXT,
        ai_keywords_json TEXT,
        matched_keywords_json TEXT,
        hash TEXT UNIQUE
      );
      CREATE INDEX IF NOT EXISTS idx_items_fetched ON items(fetched_at DESC);
      CREATE INDEX IF NOT EXISTS idx_items_published ON items(published_at DESC);
      CREATE INDEX IF NOT EXISTS idx_items_source ON items(source);
      CREATE INDEX IF NOT EXISTS idx_items_importance ON items(ai_importance);

      CREATE TABLE IF NOT EXISTS keywords (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        keyword TEXT NOT NULL UNIQUE,
        enabled INTEGER DEFAULT 1,
        created_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS crawl_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        source TEXT NOT NULL,
        started_at INTEGER,
        finished_at INTEGER,
        fetched_count INTEGER DEFAULT 0,
        inserted_count INTEGER DEFAULT 0,
        status TEXT,
        error TEXT
      );
    `,
  },
];

export function migrate() {
  const db = getDb();
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at INTEGER NOT NULL
    );
  `);
  const applied = new Set(db.prepare('SELECT id FROM _migrations').all().map((r) => r.id));
  for (const m of MIGRATIONS) {
    if (applied.has(m.id)) continue;
    db.transaction(() => {
      db.exec(m.sql);
      db.prepare('INSERT INTO _migrations (id, name, applied_at) VALUES (?, ?, ?)').run(
        m.id,
        m.name,
        Date.now(),
      );
    })();
    logger.info(`migration applied: #${m.id} ${m.name}`, 'db');
  }
}

// CLI 入口
if (import.meta.url === `file://${process.argv[1]}`) {
  migrate();
  logger.info('migrations done', 'db');
}
