// routes/daily.js
// AI 日报：最新一期（懒生成）+ 归档
import express from 'express';
import { getOrGenerateDaily, listDaily, dateKey } from '../services/daily.js';

export const dailyRouter = express.Router();

dailyRouter.get('/', (_req, res) => {
  res.json({ code: 0, data: listDaily() });
});

dailyRouter.get('/latest', async (req, res) => {
  const date = String(req.query.date || dateKey());
  try {
    let report = await getOrGenerateDaily(date);
    if (!report) {
      // 当日暂无内容时，回退到最近一期已生成的日报（近 7 天内）
      const recent = listDaily(7).find((r) => r.date !== date);
      if (recent) report = await getOrGenerateDaily(recent.date);
    }
    if (!report) {
      return res.json({ code: 0, data: null, message: '当日暂无 AI 相关内容' });
    }
    res.json({ code: 0, data: report });
  } catch (e) {
    res.status(500).json({ code: 1500, message: e.message });
  }
});

dailyRouter.get('/:date', async (req, res) => {
  const date = String(req.params.date);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ code: 1002, message: '日期格式应为 YYYY-MM-DD' });
  }
  try {
    const report = await getOrGenerateDaily(date);
    if (!report) return res.status(404).json({ code: 1001, message: '该日无日报' });
    res.json({ code: 0, data: report });
  } catch (e) {
    res.status(500).json({ code: 1500, message: e.message });
  }
});
