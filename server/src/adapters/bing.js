// adapters/bing.js
// 搜索页面 HTML 解析（不调 API），带随机 UA + 延时
import axios from 'axios';
import * as cheerio from 'cheerio';
import { BaseAdapter } from './base.js';
import { randomDelay } from '../utils/hash.js';

const UAs = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
];

function pickUA() {
  return UAs[Math.floor(Math.random() * UAs.length)];
}

export class BingAdapter extends BaseAdapter {
  constructor() {
    super('bing');
    this.http = axios.create({ timeout: 20000 });
  }

  async fetch({ query = '', limit = 30 } = {}) {
    await randomDelay(1500, 4000);
    const q = (query || 'AI 热点 科技').trim();
    const res = await this.http.get('https://www.bing.com/search', {
      params: { q, setlang: 'zh-Hans', count: limit },
      headers: { 'User-Agent': pickUA(), 'Accept-Language': 'zh-CN,zh;q=0.9' },
    });
    const $ = cheerio.load(res.data || '');
    const items = [];
    $('#b_results .b_algo, li.b_algo').each((_, el) => {
      const $a = $(el).find('h2 a').first();
      const url = $a.attr('href');
      const title = $a.text().trim();
      const content = $(el).find('.b_caption, .b_snippet, p').first().text().trim();
      if (!url || !title) return;
      items.push({
        source: this.name,
        external_id: url,
        url,
        title,
        content,
        author: '',
        lang: 'zh',
        metrics: {},
        published_at: Date.now(),
      });
    });
    return items.slice(0, limit);
  }
}
