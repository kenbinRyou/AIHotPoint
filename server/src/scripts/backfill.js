// scripts/backfill.js
// 存量数据回填：is_ai 标记 + 新分类体系 + 48h 内条目归故事线 + 首次热度采样
// 用法：node scripts/backfill.js
import 'dotenv/config';
import { migrate } from '../db/migrate.js';
import { getDb } from '../db/sqlite.js';
import {
  iterAllItems, updateBackfill, backfillCategory, listItems,
} from '../db/items.js';
import { assignStory, snapshotHeats, recomputeStoryHeat } from '../db/stories.js';
import { isAiRelated } from '../utils/ai-relevance.js';
import { logger } from '../utils/logger.js';

migrate();

const db = getDb();
const all = iterAllItems();
logger.info(`backfill start: ${all.length} items`, 'backfill');

// 1) 清空旧故事（幂等重跑）
db.prepare('UPDATE items SET story_id = NULL').run();
db.prepare('DELETE FROM stories').run();
db.prepare('DELETE FROM heat_snapshots').run();

// 2) is_ai + 新分类
let aiCount = 0;
let recatCount = 0;
for (const it of all) {
  const isAi = isAiRelated(it) ? 1 : 0;
  if (isAi) aiCount++;
  const newCat = isAi ? backfillCategory(it) : it.ai_category;
  if (newCat !== it.ai_category) recatCount++;
  updateBackfill(it.id, { is_ai: isAi, ai_category: newCat });
}

// 3) 48h 内的 AI 条目按时间顺序归故事线
const recent = listItems({
  is_ai: true,
  time_range: '48h',
  sort: 'fetched_desc',
  page: 1,
  pageSize: 1000,
}).items;
const recentAsc = [...recent].sort((a, b) => a.fetched_at - b.fetched_at);
let storyCount = 0;
const storySet = new Set();
for (const it of recentAsc) {
  const sid = assignStory(it);
  if (!storySet.has(sid)) { storySet.add(sid); storyCount++; }
}

// 4) 全量故事热度重算 + 首次采样
for (const sid of storySet) recomputeStoryHeat(sid);
const sampled = snapshotHeats();

logger.info(
  `backfill done: total=${all.length} ai=${aiCount} recategorized=${recatCount} stories=${storyCount} sampled=${sampled}`,
  'backfill',
);
console.log(`回填完成：共 ${all.length} 条，AI 相关 ${aiCount} 条，重分类 ${recatCount} 条，聚合故事 ${storyCount} 个，采样 ${sampled} 个`);
