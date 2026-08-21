// routes/reports.js —— 周报 / 月报
import express from 'express';
import { getOrGenerateWeekly, getOrGenerateMonthly, listWeekly, listMonthly } from '../services/reports.js';

export const weeklyRouter = express.Router();
export const monthlyRouter = express.Router();

weeklyRouter.get('/', (_req, res) => res.json({ code: 0, data: listWeekly() }));
weeklyRouter.get('/latest', async (req, res) => {
  const issue = req.query.issue ? String(req.query.issue) : undefined;
  try {
    const r = await getOrGenerateWeekly(issue);
    res.json({ code: 0, data: r });
  } catch (e) {
    res.status(500).json({ code: 1500, message: e.message });
  }
});
weeklyRouter.get('/:issue', async (req, res) => {
  if (!/^\d{4}-W\d{2}$/.test(req.params.issue)) {
    return res.status(400).json({ code: 1002, message: '期号格式应为 YYYY-Www' });
  }
  try {
    const r = await getOrGenerateWeekly(req.params.issue);
    if (!r) return res.status(404).json({ code: 1001, message: '该期周报不存在' });
    res.json({ code: 0, data: r });
  } catch (e) {
    res.status(500).json({ code: 1500, message: e.message });
  }
});

monthlyRouter.get('/', (_req, res) => res.json({ code: 0, data: listMonthly() }));
monthlyRouter.get('/latest', async (req, res) => {
  const issue = req.query.issue ? String(req.query.issue) : undefined;
  try {
    const r = await getOrGenerateMonthly(issue);
    res.json({ code: 0, data: r });
  } catch (e) {
    res.status(500).json({ code: 1500, message: e.message });
  }
});
monthlyRouter.get('/:issue', async (req, res) => {
  if (!/^\d{4}-\d{2}$/.test(req.params.issue)) {
    return res.status(400).json({ code: 1002, message: '期号格式应为 YYYY-MM' });
  }
  try {
    const r = await getOrGenerateMonthly(req.params.issue);
    if (!r) return res.status(404).json({ code: 1001, message: '该期月报不存在' });
    res.json({ code: 0, data: r });
  } catch (e) {
    res.status(500).json({ code: 1500, message: e.message });
  }
});
