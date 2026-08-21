// utils/hash.js
import crypto from 'node:crypto';

/**
 * 生成去重指纹
 * 用 url + title 标准化后 hash
 */
export function itemHash(url = '', title = '') {
  const norm = (s) => String(s || '').toLowerCase().replace(/\s+/g, ' ').trim();
  return crypto.createHash('sha1').update(`${norm(url)}|${norm(title)}`).digest('hex');
}

/**
 * 随机延时（毫秒）
 */
export function randomDelay(min, max) {
  const lo = Number(min) || 1000;
  const hi = Number(max) || 3000;
  return new Promise((r) => setTimeout(r, lo + Math.random() * (hi - lo)));
}

/**
 * 安全 JSON 解析
 */
export function safeJson(s, fallback = null) {
  if (s == null) return fallback;
  try {
    return JSON.parse(s);
  } catch {
    return fallback;
  }
}

/**
 * 时间窗口
 */
export function timeRangeToSince(range) {
  const now = Date.now();
  const map = {
    '1h': 60 * 60 * 1000,
    '6h': 6 * 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
    '48h': 48 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
  };
  const ms = map[range];
  return ms ? now - ms : 0;
}
