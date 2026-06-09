// adapters/google.js
// Google 搜索 HTML 解析。注意 Google 有较强反爬，这里是尽力而为，
// 被 429/403 时返回空数组而不是抛错。
import axios from 'axios';
import * as cheerio from 'cheerio';
import { BaseAdapter } from './base.js';
import { randomDelay } from '../utils/hash.js';

const UAs = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
];

export class GoogleAdapter extends BaseAdapter {
  constructor() {
    super('google');
    this.http = axios.create({ timeout: 20000 });
  }

  async fetch({ query = '', limit = 30 } = {}) {
    await randomDelay(2000, 5000);
    const q = (query || 'AI 热点').trim();
    try {
      const res = await this.http.get('https://www.google.com/search', {
        params: { q, hl: 'zh-CN', num: limit, pws: 0 },
        headers: { 'User-Agent': UAs[Math.floor(Math.random() * UAs.length)], 'Accept-Language': 'zh-CN,zh;q=0.9' },
      });
      const $ = cheerio.load(res.data || '');
      const items = [];
      $('div.g, div[data-hveid]').each((_, el) => {
        const $a = $(el).find('a[href^="http"]').first();
        const url = $a.attr('href');
        const title = $a.find('h3').text().trim() || $a.text().trim();
        const content = $(el).find('.VwiC3b, .yXK7lf').first().text().trim();
        if (!url || !title || url.includes('google.com/search')) return;
        items.push({ source: this.name, external_id: url, url, title, content, author: '', lang: 'zh', metrics: {}, published_at: Date.now() });
      });
      return items.slice(0, limit);
    } catch (e) {
      // 反爬时静默
      return [];
    }
  }
}
