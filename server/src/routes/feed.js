// routes/feed.js —— RSS 输出（无需额外依赖，手写 XML 模板）
import express from 'express';
import { listItems } from '../db/items.js';

export const feedRouter = express.Router();

const SITE = process.env.SITE_URL || 'https://aihotpoint.dev';

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function buildRss({ title, description, items }) {
  const itemsXml = items
    .map((it) => {
      const link = it.url || `${SITE}/items/${it.id}`;
      const desc = (it.ai_summary || it.content || '').slice(0, 600);
      const pub = it.fetched_at ? new Date(it.fetched_at).toUTCString() : new Date().toUTCString();
      return `    <item>
      <title>${esc(it.title)}</title>
      <link>${esc(link)}</link>
      <guid isPermaLink="false">${esc(`aihot-${it.id}-${it.source}`)}</guid>
      <pubDate>${pub}</pubDate>
      <description>${esc(desc)}</description>
      <category>${esc(it.ai_category || '')}</category>
    </item>`;
    })
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${esc(title)}</title>
    <link>${esc(SITE)}</link>
    <description>${esc(description)}</description>
    <language>zh-CN</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${itemsXml}
  </channel>
</rss>`;
}

function send(res, opts) {
  const xml = buildRss(opts);
  res.set('Content-Type', 'application/rss+xml; charset=utf-8');
  res.send(xml);
}

feedRouter.get('/feed.xml', (_req, res) => {
  const { items } = listItems({ importance: ['high', 'urgent'], time_range: '7d', sort: 'score_desc', pageSize: 30, is_ai: true });
  send(res, { title: 'AIHotPoint · 精选', description: 'AI 行业动态精选（AI 评级 high 以上）', items });
});

feedRouter.get('/feed/all.xml', (_req, res) => {
  const { items } = listItems({ time_range: '7d', sort: 'fetched_desc', pageSize: 50, is_ai: true });
  send(res, { title: 'AIHotPoint · 全部动态', description: 'AI 行业动态全量信息流', items });
});

feedRouter.get('/feed/daily.xml', (_req, res) => {
  const { items } = listItems({ time_range: '24h', sort: 'score_desc', pageSize: 40, is_ai: true });
  send(res, { title: 'AIHotPoint · AI 日报', description: '每日 AI 重点（近 24 小时）', items });
});

feedRouter.get('/feed/category/:cat.xml', (req, res) => {
  const cat = String(req.params.cat);
  const { items } = listItems({ category: cat, time_range: '30d', sort: 'fetched_desc', pageSize: 40, is_ai: true });
  send(res, { title: `AIHotPoint · ${cat}`, description: `AI 行业动态 · 分类 ${cat}`, items });
});
