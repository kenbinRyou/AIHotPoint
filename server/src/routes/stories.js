// routes/stories.js
// 故事线：热点榜单 + 事件详情
import express from 'express';
import { listStories, getStory } from '../db/stories.js';

export const storiesRouter = express.Router();

storiesRouter.get('/', (req, res) => {
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
  const time_range = String(req.query.time_range || '48h');
  res.json({ code: 0, data: listStories({ limit, time_range }) });
});

storiesRouter.get('/:id', (req, res) => {
  const story = getStory(Number(req.params.id));
  if (!story) return res.status(404).json({ code: 1001, message: 'Story not found' });
  res.json({ code: 0, data: story });
});
