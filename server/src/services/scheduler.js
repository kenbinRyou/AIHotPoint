// services/scheduler.js
// 调度器：定时抓取所有源，并把结果入库 + AI 分析 + 故事线聚合 + 热度采样 + 日报
import cron from 'node-cron';
import { getAdapter, FEED_SOURCE_KEYS } from '../adapters/index.js';
import { bulkInsert, setAiResult, setAiReason, findPendingAi, getKeywords, logCrawl } from '../db/items.js';
import { analyzeItem, matchKeywords, generateReason } from '../ai/bailian.js';
import { assignStory, snapshotHeats, refreshStoryDigest } from '../db/stories.js';
import { getOrGenerateDaily, dateKey } from './daily.js';
import { enrichFullText, fulltextEnabled } from './fulltext.js';
import { logger } from '../utils/logger.js';

const SOURCE_KEYS = FEED_SOURCE_KEYS; // 只抓 RSS + 社交平台，搜索引擎降级为搜索功能专用
const ENABLED = process.env.ENABLE_AI_ANALYZE !== 'false';
const CRON_EXPR = process.env.CRAWL_CRON || '*/5 * * * *';
const SNAPSHOT_CRON = process.env.SNAPSHOT_CRON || '0 * * * *';
const DAILY_CRON = process.env.DAILY_CRON || '0 8 * * *';
const DELAY_MIN = Number(process.env.CRAWL_DELAY_MIN) || 2000;
const DELAY_MAX = Number(process.env.CRAWL_DELAY_MAX) || 6000;

async function delay() {
  const lo = DELAY_MIN, hi = DELAY_MAX;
  return new Promise((r) => setTimeout(r, lo + Math.random() * (hi - lo)));
}

/**
 * 抓取单个源：入库（自动标记 is_ai）→ AI 相关条目归入故事线
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
    // AI 相关的新条目归入故事线
    let storyIds = new Set();
    for (const row of inserted) {
      if (row.is_ai) {
        try {
          storyIds.add(assignStory(row));
        } catch (e) {
          logger.warn(`assignStory failed for item ${row.id}: ${e.message}`, 'stories');
        }
      }
    }
    logCrawl({
      source: name,
      started_at: started,
      finished_at: Date.now(),
      fetched_count: items.length,
      inserted_count: inserted.length,
      status: 'ok',
    });
    logger.info(`crawl ${name}: fetched=${items.length} inserted=${inserted.length}`, 'crawl');

    // 故事综述刷新（异步、不阻塞）
    if (ENABLED && storyIds.size) {
      for (const sid of storyIds) refreshStoryDigest(sid).catch(() => {});
    }
    return { source: name, fetched: items.length, inserted: inserted.length };
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
    if (ai) {
      setAiResult(it.id, ai);
      // 对 high 以上条目生成推荐理由（独立 AI 调用，控制成本）
      if (ai.importance === 'high' || ai.importance === 'urgent') {
        const reason = await generateReason({ ...it, ...ai });
        if (reason) setAiReason(it.id, reason);
        // 全文抓取 + 中文翻译（仅开关开启时；控制 token 成本）
        if (fulltextEnabled()) {
          await enrichFullText({ id: it.id, url: it.url, full_text_zh: it.full_text_zh });
          await new Promise((r) => setTimeout(r, 300));
        }
      }
    }
    await new Promise((r) => setTimeout(r, 400));
  }
}

/** 生成（或复用）前一天的日报（早晨 8 点出刊，覆盖昨日新闻） */
function yesterdayKey() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return dateKey(d);
}
async function generateDailyReport() {
  try {
    const r = await getOrGenerateDaily(yesterdayKey());
    logger.info(`daily report ${r ? 'ready' : 'skipped (no items)'}: ${yesterdayKey()}`, 'daily');
  } catch (e) {
    logger.error(`daily report failed: ${e.message}`, 'daily');
  }
}

let task = null;
let snapshotTask = null;
let dailyTask = null;
export function startScheduler() {
  if (task) return task;
  task = cron.schedule(CRON_EXPR, () => {
    crawlAll().catch((e) => logger.error(`scheduler error: ${e.message}`, 'crawl'));
  });
  // 小时级热度采样（为活跃故事写快照，供趋势图）
  snapshotTask = cron.schedule(SNAPSHOT_CRON, () => {
    try { snapshotHeats(); } catch (e) { logger.error(`snapshot failed: ${e.message}`, 'stories'); }
  });
  // 每日 23:50 生成当日日报（当天内容基本收口）
  dailyTask = cron.schedule(DAILY_CRON, generateDailyReport);
  logger.info(`scheduler started: crawl=${CRON_EXPR} snapshot=${SNAPSHOT_CRON} daily=${DAILY_CRON}`, 'crawl');
  // 启动时补一次采样与日报（懒兜底）
  try { snapshotHeats(); } catch {}
  return task;
}
export function stopScheduler() {
  if (task) task.stop();
  if (snapshotTask) snapshotTask.stop();
  if (dailyTask) dailyTask.stop();
  task = snapshotTask = dailyTask = null;
}
