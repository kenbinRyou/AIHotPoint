// app.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { logger } from './utils/logger.js';
import { migrate } from './db/migrate.js';
import { startScheduler } from './services/scheduler.js';
import { itemsRouter } from './routes/items.js';
import { searchRouter } from './routes/search.js';
import { keywordsRouter } from './routes/keywords.js';
import { crawlRouter } from './routes/crawl.js';
import { storiesRouter } from './routes/stories.js';
import { dailyRouter } from './routes/daily.js';
import { topicsRouter } from './routes/topics.js';
import { feedbackRouter } from './routes/feedback.js';
import { weeklyRouter, monthlyRouter } from './routes/reports.js';
import { feedRouter } from './routes/feed.js';

migrate();
const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// 简单请求日志
app.use((req, _res, next) => {
  logger.debug(`${req.method} ${req.url}`, 'http');
  next();
});

// 健康检查
app.get('/api/health', (_req, res) => res.json({ code: 0, data: { ok: true, ts: Date.now() } }));

// 路由
app.use('/api/items', itemsRouter);
app.use('/api/search', searchRouter);
app.use('/api/keywords', keywordsRouter);
app.use('/api/crawl', crawlRouter);
app.use('/api/stories', storiesRouter);
app.use('/api/daily', dailyRouter);
app.use('/api/topics', topicsRouter);
app.use('/api/feedback', feedbackRouter);
app.use('/api/weekly', weeklyRouter);
app.use('/api/monthly', monthlyRouter);
app.use('/', feedRouter);

// 统一错误兜底
app.use((err, _req, res, _next) => {
  logger.error(`${err.message}`, 'err', { stack: err.stack });
  res.status(500).json({ code: 1500, message: '服务器内部错误' });
});

const PORT = Number(process.env.PORT) || 4000;
app.listen(PORT, () => {
  logger.info(`server listening on http://localhost:${PORT}`, 'app');
  if (process.env.NODE_ENV !== 'test') startScheduler();
});
