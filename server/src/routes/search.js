// routes/search.js
// 搜索页：用户主动搜索，实时抓取
// 数据不会进入主页的"实时热点流"（保持数据源分离）
import express from 'express';
import { getAdapter, SOURCE_META } from '../adapters/index.js';
import { logger } from '../utils/logger.js';

export const searchRouter = express.Router();

searchRouter.post('/', async (req, res) => {
  const { keyword = '', sources = [], analyze = false } = req.body || {};
  const kw = String(keyword || '').trim();
  if (!kw) return res.status(400).json({ code: 1002, message: 'keyword 不能为空' });

  const allKeys = SOURCE_META.map((s) => s.key);
  const wanted = (Array.isArray(sources) && sources.length ? sources : allKeys).filter((s) => allKeys.includes(s));

  const tasks = await Promise.allSettled(wanted.map(async (name) => {
    const adapter = getAdapter(name);
    if (!adapter) return { source: name, items: [], error: 'no-adapter' };
    try {
      const items = await adapter.fetch({ query: kw, limit: 20 });
      return { source: name, items };
    } catch (e) {
      return { source: name, items: [], error: e.message };
    }
  }));

  const perSource = tasks.map((t, i) => ({
    source: wanted[i],
    ...(t.status === 'fulfilled' ? t.value : { items: [], error: t.reason?.message }),
  }));

  // 合并所有 items
  let merged = perSource.flatMap((r) => r.items || []);

  // 可选：对结果做 AI 分析（按需）
  if (analyze && process.env.ENABLE_AI_ANALYZE !== 'false') {
    try {
      const { analyzeItem } = await import('../ai/bailian.js');
      const limited = merged.slice(0, 10);
      const analyzed = await Promise.all(limited.map(async (it) => ({ ...it, ai: await analyzeItem(it) })));
      // 把分析结果回填到 merged
      analyzed.forEach((a) => {
        const idx = merged.indexOf(merged.find((m) => m.url === a.url && m.source === a.source));
        if (idx >= 0) merged[idx] = a;
      });
    } catch (e) {
      logger.warn(`analyze in search failed: ${e.message}`, 'search');
    }
  }

  // 过滤为 AI 相关内容（项目定位：只关注 AI 领域；AI 分析出的关键词也可作为判定依据）
  const { isAiRelated } = await import('../utils/ai-relevance.js');
  merged = merged.filter((it) =>
    isAiRelated(it) || (it.ai?.is_ai === true) ||
    (it.ai?.keywords?.length && isAiRelated({ title: it.title, keywords: it.ai.keywords })),
  );
  perSource.forEach((p) => {
    p.items = (p.items || []).filter((it) => merged.some((m) => m.url === it.url && m.source === it.source));
  });

  res.json({
    code: 0,
    data: { keyword: kw, perSource, total: merged.length, items: merged, fetchedAt: Date.now() },
  });
});
