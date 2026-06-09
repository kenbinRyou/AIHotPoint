// db/sqlite.js
import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { logger } from '../utils/logger.js';

let db = null;

export function getDb() {
  if (db) return db;
  const dbPath = process.env.DB_PATH || './data/aihotpoint.db';
  const absPath = path.isAbsolute(dbPath) ? dbPath : path.resolve(process.cwd(), dbPath);
  fs.mkdirSync(path.dirname(absPath), { recursive: true });
  db = new Database(absPath);
  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = NORMAL');
  logger.info(`SQLite opened at ${absPath}`, 'db');
  return db;
}

export function closeDb() {
  if (db) {
    db.close();
    db = null;
  }
}
