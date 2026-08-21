// routes/items.js
import express from 'express';
import { listItems, getItemById, stats } from '../db/items.js';
import { SOURCE_META } from '../adapters/index.js';

export const itemsRouter = express.Router();

// GET /api/items（默认只出 AI 相关内容；?all=1 查看全部）
itemsRouter.get('/', (req, res) => {
  const {
    sources = '',
    source_category = '',
    importance = '',
    keyword = '',
    category = '',
    time_range = '24h',
    sort = 'fetched_desc',
    page = 1,
    pageSize = 20,
    all = '',
  } = req.query;
  // 信源分类筛选：source_category 优先于 sources
  let sourceKeys = String(sources).split(',').filter(Boolean);
  if (source_category) {
    sourceKeys = SOURCE_META.filter((s) => s.category === String(source_category)).map((s) => s.key);
  }
  const result = listItems({
    sources: sourceKeys,
    importance: String(importance).split(',').filter(Boolean),
    keyword: String(keyword || '').trim(),
    category: String(category || '').trim(),
    time_range: String(time_range || '24h'),
    sort: String(sort || 'fetched_desc'),
    page: Math.max(1, Number(page) || 1),
    pageSize: Math.min(100, Math.max(1, Number(pageSize) || 20)),
    is_ai: all !== '1',
  });
  res.json({
    code: 0,
    data: result.items,
    meta: { page: Number(page), pageSize: Number(pageSize), total: result.total },
  });
});

itemsRouter.get('/sources', (_req, res) => {
  res.json({ code: 0, data: SOURCE_META });
});

itemsRouter.get('/stats', (_req, res) => {
  res.json({ code: 0, data: stats() });
});

itemsRouter.get('/:id', (req, res) => {
  const it = getItemById(Number(req.params.id));
  if (!it) return res.status(404).json({ code: 1001, message: 'Item not found' });
  res.json({ code: 0, data: it });
});
