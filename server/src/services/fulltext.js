// services/fulltext.js
// 全文抓取 + 中文翻译（P6：完全对齐目标站详情页「全文翻译」）
// 默认关闭，需 FULLTEXT_TRANSLATE=on 才启用（控制 token 成本）
import { translateText } from '../ai/bailian.js';
import { setFullText } from '../db/items.js';
import { logger } from '../utils/logger.js';

const ENABLED = process.env.FULLTEXT_TRANSLATE === 'on';
const MAX_RAW = 20000;

/** 抓取并提取网页正文（cheerio，失败返回 null） */
export async function fetchArticle(url) {
  if (!url || !/^https?:\/\//i.test(url)) return null;
  try {
    const resp = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(8000),
    });
    if (!resp.ok) return null;
    const html = await resp.text();
    const { load } = await import('cheerio');
    const $ = load(html);
    $('script, style, noscript, nav, header, footer, aside, form, button, svg').remove();
    const root = $('article').length ? $('article') : $('main').length ? $('main') : $('body');
    const paras = root
      .find('p, li, h1, h2, h3')
      .map((_, el) => $(el).text().trim())
      .get()
      .filter((t) => t.length > 30);
    const text = paras.join('\n\n').replace(/\n{3,}/g, '\n\n').slice(0, MAX_RAW);
    return text.length > 80 ? text : null;
  } catch (e) {
    logger.warn(`fetchArticle failed ${url}: ${e.message}`, 'fulltext');
    return null;
  }
}

/**
 * 为单条 item 抓取全文并翻译成中文译文，落库
 * 仅在开关开启且内容为 high/urgent 时由调度器调用
 */
export async function enrichFullText(item) {
  if (!ENABLED) return false;
  if (item.full_text_zh) return true; // 已翻译
  const raw = await fetchArticle(item.url).catch(() => null);
  if (!raw) return false;
  const zh = await translateText(raw).catch(() => null);
  if (!zh) return false;
  try {
    setFullText(item.id, raw, zh);
    logger.info(`fulltext translated: item ${item.id} (${zh.length} chars)`, 'fulltext');
    return true;
  } catch (e) {
    logger.error(`setFullText failed: ${e.message}`, 'fulltext');
    return false;
  }
}

export const fulltextEnabled = () => ENABLED;
