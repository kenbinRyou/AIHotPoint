// adapters/sogou.js
// 搜狗微信搜索 HTML
import axios from 'axios';
import * as cheerio from 'cheerio';
import { BaseAdapter } from './base.js';
import { randomDelay } from '../utils/hash.js';

export class SogouAdapter extends BaseAdapter {
  constructor() {
    super('sogou');
    this.http = axios.create({ timeout: 20000 });
  }

  async fetch({ query = '', limit = 30 } = {}) {
    await randomDelay(1500, 4000);
    const q = (query || 'AI 热点').trim();
    try {
      const res = await this.http.get('https://weixin.sogou.com/weixin', {
        params: { type: 2, query: q, page: 1 },
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36' },
      });
      const $ = cheerio.load(res.data || '');
      const items = [];
      $('.news-list li, .wx-rb, .vr-title').each((_, el) => {
        const $a = $(el).find('a').first();
        const url = $a.attr('href');
        const title = $a.text().trim();
        const content = $(el).find('p, .txt-info, .txt').first().text().trim();
        if (!url || !title) return;
        items.push({ source: this.name, external_id: url, url, title, content, author: '', lang: 'zh', metrics: {}, published_at: Date.now() });
      });
      if (items.length === 0) {
        // fallback：搜狗网页
        const res2 = await this.http.get('https://www.sogou.com/web', {
          params: { query: q },
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36' },
        });
        const $2 = cheerio.load(res2.data || '');
        $2('.vr-title a, .vrwrap a[href^="http"]').each((_, el) => {
          const $a = $2(el);
          const url = $a.attr('href');
          const title = $a.text().trim();
          if (!url || !title) return;
          items.push({ source: this.name, external_id: url, url, title, content: '', author: '', lang: 'zh', metrics: {}, published_at: Date.now() });
        });
      }
      return items.slice(0, limit);
    } catch {
      return [];
    }
  }
}
