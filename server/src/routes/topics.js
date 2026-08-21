// routes/topics.js
// 主题地图：分组主题 + 计数；主题详情 = 该主题关键词命中的 AI 条目
import express from 'express';
import { listTopics, topicItemIds, getTopic } from '../services/topics.js';
import { listItems } from '../db/items.js';

export const topicsRouter = express.Router();

topicsRouter.get('/', (_req, res) => {
  res.json({ code: 0, data: listTopics() });
});

topicsRouter.get('/:key', (req, res) => {
  const topic = getTopic(String(req.params.key));
  if (!topic) return res.status(404).json({ code: 1001, message: 'Topic not found' });
  const ids = topicItemIds(String(req.params.key), 200);
  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = Math.min(50, Math.max(1, Number(req.query.pageSize) || 20));
  const result = listItems({ ids, time_range: 'all', sort: 'fetched_desc', page, pageSize });
  res.json({
    code: 0,
    data: result.items,
    meta: {
      topic: { key: topic.key, name: topic.name, desc: topic.desc },
      page,
      pageSize,
      total: result.total,
    },
  });
});
