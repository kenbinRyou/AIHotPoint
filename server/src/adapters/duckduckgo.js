// adapters/duckduckgo.js
// 使用 DDG 的 lite 端点（HTML），更易抓取
import axios from 'axios';
import * as cheerio from 'cheerio';
import { BaseAdapter } from './base.js';
import { randomDelay } from '../utils/hash.js';

export class DuckDuckGoAdapter extends BaseAdapter {
  constructor() {
    super('duckduckgo');
    this.http = axios.create({ timeout: 20000 });
  }

  async fetch({ query = '', limit = 30 } = {}) {
    await randomDelay(1000, 3000);
    const q = (query || 'AI news').trim();
    try {
      const res = await this.http.get('https://html.duckduckgo.com/html/', {
        params: { q, kl: 'us-en' },
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36' },
      });
      const $ = cheerio.load(res.data || '');
      const items = [];
      $('.result, .result__body').each((_, el) => {
        const $a = $(el).find('a.result__a, a').first();
        const url = $a.attr('href');
        const title = $a.text().trim();
        const content = $(el).find('.result__snippet').text().trim();
        if (!url || !title) return;
        items.push({ source: this.name, external_id: url, url, title, content, author: '', lang: 'en', metrics: {}, published_at: Date.now() });
      });
      return items.slice(0, limit);
    } catch {
      return [];
    }
  }
}
