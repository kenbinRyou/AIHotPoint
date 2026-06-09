// routes/keywords.js
import express from 'express';
import { getKeywords, addKeyword, deleteKeyword } from '../db/items.js';

export const keywordsRouter = express.Router();

keywordsRouter.get('/', (_req, res) => {
  res.json({ code: 0, data: getKeywords() });
});

keywordsRouter.post('/', (req, res) => {
  const { keyword } = req.body || {};
  const r = addKeyword(keyword);
  if (!r) return res.status(400).json({ code: 1003, message: '关键词无效或已存在' });
  res.json({ code: 0, data: r });
});

keywordsRouter.delete('/:id', (req, res) => {
  const c = deleteKeyword(Number(req.params.id));
  res.json({ code: 0, data: { deleted: c } });
});
