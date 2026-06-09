// routes/crawl.js
// 手动触发抓取（调试/紧急刷新用）
import express from 'express';
import { crawlSource, crawlAll, analyzePending } from '../services/scheduler.js';

export const crawlRouter = express.Router();

crawlRouter.post('/trigger', async (req, res) => {
  const { source } = req.body || {};
  if (source) {
    const r = await crawlSource(String(source));
    return res.json({ code: 0, data: r });
  }
  // 不阻塞响应
  crawlAll().catch(() => {});
  res.json({ code: 0, data: { message: '全量抓取已在后台启动' } });
});

crawlRouter.post('/analyze', async (_req, res) => {
  analyzePending(30).catch(() => {});
  res.json({ code: 0, data: { message: 'AI 分析已在后台启动' } });
});
