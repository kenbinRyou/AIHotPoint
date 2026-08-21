// routes/feedback.js —— 用户反馈收集（文件落库，避免引入额外表）
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.resolve(__dirname, '../../data/feedback.jsonl');

export const feedbackRouter = express.Router();

function append(entry) {
  try {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    fs.appendFileSync(DATA_FILE, JSON.stringify(entry) + '\n', 'utf-8');
    return true;
  } catch (e) {
    console.error('[feedback] write failed', e);
    return false;
  }
}

feedbackRouter.post('/', (req, res) => {
  const { text, contact } = req.body || {};
  if (!text || !String(text).trim()) {
    return res.status(400).json({ code: 1003, message: '反馈内容不能为空' });
  }
  const ok = append({
    text: String(text).trim(),
    contact: contact ? String(contact).trim() : '',
    ts: new Date().toISOString(),
    ua: req.headers['user-agent'] || '',
  });
  if (!ok) return res.status(500).json({ code: 1500, message: '保存失败' });
  res.json({ code: 0, data: { ok: true } });
});
