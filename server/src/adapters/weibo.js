// adapters/weibo.js
// 微博：抓取热搜榜公开页（m.weibo.cn / s.weibo.com）
// 注意：访问频率别太高（限速），加随机延时
import axios from 'axios';
import * as cheerio from 'cheerio';
import { BaseAdapter } from './base.js';
import { randomDelay } from '../utils/hash.js';

export class WeiboAdapter extends BaseAdapter {
  constructor() {
    super('weibo');
    this.http = axios.create({
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
        'Accept': 'text/html,application/xhtml+xml',
      },
    });
  }

  async fetch({ query = '', limit = 30 } = {}) {
    await randomDelay(2000, 5000);
    const items = [];
    try {
      // 公开热搜榜（移动端 m.weibo.cn）
      const res = await this.http.get('https://s.weibo.com/top/summary');
      const $ = cheerio.load(res.data || '');
      $('td-02 a, .td-02 a').each((_, el) => {
        const $a = $(el);
        const title = $a.text().trim();
        const href = $a.attr('href');
        if (!title || !href) return;
        const url = href.startsWith('http') ? href : `https://s.weibo.com${href}`;
        items.push({
          source: this.name,
          external_id: href.split('?')[0],
          url,
          title,
          content: '',
          author: '',
          lang: 'zh',
          metrics: {},
          published_at: Date.now(),
        });
      });

      // 如果有 query，再走 weibo 搜索（公开）
      if (query && items.length < limit) {
        try {
          const res2 = await this.http.get('https://m.weibo.cn/search', {
            params: { containerid: '100103type=1&q', q: query },
            headers: { 'MWeibo-Pwa': '1' },
          });
          const $2 = cheerio.load(res2.data || '');
          $2('.card .txt').each((_, el) => {
            const title = $2(el).text().trim();
            if (!title) return;
            items.push({
              source: this.name,
              external_id: `q-${query}-${title.slice(0, 20)}`,
              url: `https://m.weibo.cn/search?containerid=100103type%3D1%26q%3D${encodeURIComponent(query)}`,
              title: title.slice(0, 200),
              content: '',
              author: '',
              lang: 'zh',
              metrics: {},
              published_at: Date.now(),
            });
          });
        } catch { /* 静默 */ }
      }
    } catch { /* 静默 */ }
    return items.slice(0, limit);
  }
}
