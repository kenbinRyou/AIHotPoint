// adapters/rss.js
// 通用 RSS/Atom 适配器：解析标准 RSS feed，对齐 AIHOT 信源结构
import RSSParser from 'rss-parser';
import { BaseAdapter } from './base.js';
import { randomDelay } from '../utils/hash.js';

const parser = new RSSParser({
  timeout: 20000,
  headers: {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*',
  },
});

export class RssFeedAdapter extends BaseAdapter {
  constructor(config) {
    super(config.key);
    this.label = config.label;
    this.feedUrl = config.feedUrl;
    this.category = config.category;
    this.lang = config.lang || 'en';
  }

  async fetch({ limit = 30 } = {}) {
    await randomDelay(500, 1500);
    const feed = await parser.parseURL(this.feedUrl);
    const items = (feed.items || []).slice(0, limit);
    return items.map((item) => ({
      source: this.name,
      external_id: item.guid || item.link || '',
      url: item.link || '',
      title: item.title || '(无标题)',
      content: stripHtml(item.contentSnippet || item.content || item.summary || ''),
      author: extractAuthor(item.creator || item.author),
      lang: this.lang,
      metrics: {},
      published_at: item.isoDate
        ? new Date(item.isoDate).getTime()
        : item.pubDate
          ? new Date(item.pubDate).getTime()
          : Date.now(),
    }));
  }
}

/** 粗清洗 HTML 标签和常见实体 */
function stripHtml(html) {
  return String(html || '')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * 从 rss-parser 解析的 author 字段中提取字符串
 * 有些 RSS（如 Google Blog）的 <author> 是 <author><name>...</name></author> 结构，被解析为 {name: [...]} 对象
 */
function extractAuthor(v) {
  if (!v) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'object') {
    if (v.name) {
      if (typeof v.name === 'string') return v.name;
      if (Array.isArray(v.name) && v.name[0]) return String(v.name[0]);
    }
    if (v['#text']) return String(v['#text']);
  }
  return String(v).slice(0, 100);
}
