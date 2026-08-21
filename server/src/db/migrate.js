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
  {
    id: 2,
    name: 'phase2-ai-stories-daily',
    sql: `
      ALTER TABLE items ADD COLUMN is_ai INTEGER DEFAULT 0;
      ALTER TABLE items ADD COLUMN story_id INTEGER;
      CREATE INDEX IF NOT EXISTS idx_items_is_ai ON items(is_ai);
      CREATE INDEX IF NOT EXISTS idx_items_story ON items(story_id);

      CREATE TABLE IF NOT EXISTS stories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        digest TEXT,
        digest_item_count INTEGER DEFAULT 0,
        heat REAL DEFAULT 0,
        peak_heat REAL DEFAULT 0,
        item_count INTEGER DEFAULT 0,
        first_seen INTEGER NOT NULL,
        last_seen INTEGER NOT NULL,
        created_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_stories_heat ON stories(heat DESC);
      CREATE INDEX IF NOT EXISTS idx_stories_last_seen ON stories(last_seen DESC);

      CREATE TABLE IF NOT EXISTS heat_snapshots (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        story_id INTEGER NOT NULL,
        ts INTEGER NOT NULL,
        heat REAL NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_heat_story_ts ON heat_snapshots(story_id, ts);

      CREATE TABLE IF NOT EXISTS daily_reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL UNIQUE,
        title TEXT,
        content TEXT,
        item_ids_json TEXT,
        generated_at INTEGER NOT NULL
      );
    `,
  },
  {
    id: 3,
    name: 'add-ai-reason',
    sql: `
      ALTER TABLE items ADD COLUMN ai_reason TEXT;
    `,
  },
  {
    id: 4,
    name: 'daily-structured',
    sql: `
      ALTER TABLE daily_reports ADD COLUMN intro TEXT;
      ALTER TABLE daily_reports ADD COLUMN stats_json TEXT;
      ALTER TABLE daily_reports ADD COLUMN sections_json TEXT;
    `,
  },
  {
    id: 5,
    name: 'weekly-monthly',
    sql: `
      CREATE TABLE IF NOT EXISTS weeklies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        issue TEXT NOT NULL UNIQUE,
        period_start INTEGER NOT NULL,
        period_end INTEGER NOT NULL,
        title TEXT,
        intro TEXT,
        stats_json TEXT,
        sections_json TEXT,
        item_ids_json TEXT,
        generated_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS monthlies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        issue TEXT NOT NULL UNIQUE,
        period_start INTEGER NOT NULL,
        period_end INTEGER NOT NULL,
        title TEXT,
        intro TEXT,
        stats_json TEXT,
        sections_json TEXT,
        item_ids_json TEXT,
        generated_at INTEGER NOT NULL
      );
    `,
  },
  {
    id: 6,
    name: 'fulltext-translate',
    sql: `
      ALTER TABLE items ADD COLUMN full_text TEXT;
      ALTER TABLE items ADD COLUMN full_text_zh TEXT;
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
