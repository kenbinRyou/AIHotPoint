// adapters/page.js
// 通用 HTML 页面爬取适配器：用于没有标准 RSS 的 AI 公司官博
// 通过 extractItems 函数自定义提取逻辑
import axios from 'axios';
import * as cheerio from 'cheerio';
import { BaseAdapter } from './base.js';
import { randomDelay } from '../utils/hash.js';

export class PageScraperAdapter extends BaseAdapter {
  constructor(config) {
    super(config.key);
    this.config = {
      url: config.url,
      category: config.category,
      lang: config.lang || 'en',
      extractItems: config.extractItems, // ($) => [{ title, url, summary?, author?, published_at? }]
    };
  }

  async fetch({ limit = 30 } = {}) {
    await randomDelay(800, 2000);
    const res = await axios.get(this.config.url, {
      timeout: 20000,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      maxRedirects: 5,
      validateStatus: (s) => s < 500,
    });
    if (res.status >= 400) {
      throw new Error(`HTTP ${res.status} from ${this.config.url}`);
    }
    const $ = cheerio.load(res.data);
    const items = this.config.extractItems($, res.data) || [];
    return items.slice(0, limit).map((it) => ({
      source: this.name,
      external_id: it.url,
      url: it.url,
      title: (it.title || '').trim(),
      content: (it.summary || '').trim(),
      author: it.author || '',
      lang: this.config.lang,
      metrics: {},
      published_at: Number.isFinite(it.published_at) ? it.published_at : Date.now(),
    }));
  }
}

// ---------------------------------------------------------------------------
// 通用工具：稳健地从 <a> 标签中提取标题/日期/摘要
// 适用于"a 标签内嵌文章卡片"的页面（Anthropic 等）

const DATE_REGEX = /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2},?\s+\d{4}\b/i;

/**
 * 从 a 标签的子元素中找最长的非日期文本作为标题
 */
export function pickTitle($, $el) {
  // 优先 h2/h3
  const $h = $el.find('h1, h2, h3').first();
  if ($h.length) return $h.text().trim();
  // 取子元素文本（排除 time）
  const texts = $el
    .children()
    .map((_, n) => $(n).text().trim())
    .get()
    .filter((t) => t && t.length > 2 && !DATE_REGEX.test(t));
  if (texts.length) {
    return texts.sort((a, b) => b.length - a.length)[0];
  }
  return '';
}

/**
 * 从父容器找 time/datetime
 */
export function pickDate($, $el) {
  const $time = $el.find('time').first();
  if ($time.length) {
    const dt = $time.attr('datetime');
    if (dt) {
      const t = new Date(dt).getTime();
      if (Number.isFinite(t)) return t;
    }
    const txt = $time.text().trim();
    if (txt) {
      const t = new Date(txt).getTime();
      if (Number.isFinite(t)) return t;
    }
  }
  return null;
}

/**
 * 从父容器找摘要
 */
export function pickSummary($, $el) {
  const $p = $el.find('p').first();
  if ($p.length) {
    const t = $p.text().trim();
    if (t && t.length > 10) return t;
  }
  return '';
}

/**
 * 从 URL slug 推断标题（兜底策略）
 */
export function slugToTitle(slug) {
  return String(slug || '')
    .split('-')
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : ''))
    .filter(Boolean)
    .join(' ');
}
