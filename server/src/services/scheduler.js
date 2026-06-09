// services/scheduler.js
// 调度器：定时抓取所有源，并把结果入库 + AI 分析
import cron from 'node-cron';
import { getAdapter, SOURCE_META } from '../adapters/index.js';
import { bulkInsert, setAiResult, findPendingAi, getKeywords, logCrawl } from '../db/items.js';
import { analyzeItem, matchKeywords } from '../ai/bailian.js';
import { logger } from '../utils/logger.js';

const SOURCE_KEYS = SOURCE_META.map((s) => s.key);
const ENABLED = process.env.ENABLE_AI_ANALYZE !== 'false';
const CRON_EXPR = process.env.CRAWL_CRON || '*/5 * * * *';
const DELAY_MIN = Number(process.env.CRAWL_DELAY_MIN) || 2000;
const DELAY_MAX = Number(process.env.CRAWL_DELAY_MAX) || 6000;

async function delay() {
  const lo = DELAY_MIN, hi = DELAY_MAX;
  return new Promise((r) => setTimeout(r, lo + Math.random() * (hi - lo)));
}

/**
 * 抓取单个源
 */
export async function crawlSource(name) {
  const adapter = getAdapter(name);
  if (!adapter) return { source: name, status: 'no-adapter' };
  const started = Date.now();
  try {
    const items = await adapter.fetch({ limit: 30 });
    const keywords = getKeywords().filter((k) => k.enabled).map((k) => k.keyword);
    // 给每个 item 算一遍命中的关键词
    const enriched = items.map((it) => {
      const text = `${it.title} ${it.content || ''}`;
      return { ...it, _matched: matchKeywords(text, keywords) };
    });
    const inserted = bulkInsert(
      enriched.map(({ _matched, ...rest }) => rest),
      enriched.map((it) => it._matched),
    );
    logCrawl({
      source: name,
      started_at: started,
      finished_at: Date.now(),
      fetched_count: items.length,
      inserted_count: inserted,
      status: 'ok',
    });
    logger.info(`crawl ${name}: fetched=${items.length} inserted=${inserted}`, 'crawl');
    return { source: name, fetched: items.length, inserted };
  } catch (e) {
    logCrawl({ source: name, started_at: started, finished_at: Date.now(), status: 'error', error: e.message });
    logger.error(`crawl ${name} failed: ${e.message}`, 'crawl');
    return { source: name, error: e.message };
  }
}

/**
 * 抓取所有源（顺序执行，每个之间随机延时）
 */
export async function crawlAll() {
  logger.info('crawl all sources start', 'crawl');
  for (const name of SOURCE_KEYS) {
    await crawlSource(name);
    await delay();
  }
  // AI 分析新插入的
  if (ENABLED) await analyzePending();
}

/**
 * 对未做 AI 分析的 item 跑 AI
 */
export async function analyzePending(limit = 20) {
  if (!ENABLED) return;
  const items = findPendingAi(limit);
  if (!items.length) return;
  logger.info(`AI analyze ${items.length} pending`, 'ai');
  for (const it of items) {
    const ai = await analyzeItem(it);
    if (ai) setAiResult(it.id, ai);
    await new Promise((r) => setTimeout(r, 400));
  }
}

let task = null;
export function startScheduler() {
  if (task) return task;
  task = cron.schedule(CRON_EXPR, () => {
    crawlAll().catch((e) => logger.error(`scheduler error: ${e.message}`, 'crawl'));
  });
  logger.info(`scheduler started: ${CRON_EXPR}`, 'crawl');
  return task;
}
export function stopScheduler() { if (task) task.stop(); task = null; }
