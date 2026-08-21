// adapters/page-sources.js
// HTML 页面爬取源配置：用于没有标准 RSS 的 AI 公司官博
// 每个源配置对应的 URL 和 extractItems 函数（针对网站结构定制）

import { pickTitle, pickDate, pickSummary, slugToTitle } from './page.js';

const ANTHROPIC_BASE = 'https://www.anthropic.com';

/**
 * Anthropic News 提取器
 * 页面结构：a 标签内嵌文章卡片，Featured 区 article + List 区 li
 */
function extractAnthropicNews($, html) {
  const items = [];
  $('a[href^="/news/"], a[href^="/features/"]').each((_, el) => {
    const $a = $(el);
    const href = $a.attr('href');
    if (!href) return;
    const $ancestor = $a.closest('article, li').first();
    // 标题：优先 a 内 h2，否则用 a 的最长非日期子文本，否则用 slug
    let title = pickTitle($, $a);
    if (!title || title.length < 3) title = slugToTitle(href.split('/').pop());
    if (title.length < 3) return;
    // 日期：time 元素（datetime 属性或文本）
    const published_at = pickDate($, $ancestor) || pickDate($, $a) || Date.now();
    // 摘要：a 父容器的 p 标签
    const summary = pickSummary($, $ancestor) || pickSummary($, $a);
    items.push({
      title: title.slice(0, 200),
      url: ANTHROPIC_BASE + href,
      summary: summary.slice(0, 500),
      published_at,
    });
  });
  // 去重
  const seen = new Set();
  return items.filter((it) => (seen.has(it.url) ? false : (seen.add(it.url), true)));
}

export const PAGE_SOURCES = [
  {
    key: 'anthropic',
    label: 'Anthropic',
    url: 'https://www.anthropic.com/news',
    category: 'ai-official',
    lang: 'en',
    extractItems: extractAnthropicNews,
  },
];
