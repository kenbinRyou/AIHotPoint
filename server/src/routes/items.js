// routes/items.js
import express from 'express';
import { listItems, getItemById, stats } from '../db/items.js';
import { SOURCE_META } from '../adapters/index.js';

export const itemsRouter = express.Router();

// GET /api/items
itemsRouter.get('/', (req, res) => {
  const {
    sources = '',
    importance = '',
    keyword = '',
    time_range = '24h',
    sort = 'fetched_desc',
    page = 1,
    pageSize = 20,
  } = req.query;
  const result = listItems({
    sources: String(sources).split(',').filter(Boolean),
    importance: String(importance).split(',').filter(Boolean),
    keyword: String(keyword || '').trim(),
    time_range: String(time_range || '24h'),
    sort: String(sort || 'fetched_desc'),
    page: Math.max(1, Number(page) || 1),
    pageSize: Math.min(100, Math.max(1, Number(pageSize) || 20)),
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
