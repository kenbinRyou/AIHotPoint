// adapters/bilibili.js
// B 站热门：使用其公开 API（无需认证）
//   https://api.bilibili.com/x/web-interface/search/square?limit=...
//   备用：https://www.bilibili.com/v/popular/rank/all
import axios from 'axios';
import { BaseAdapter } from './base.js';
import { randomDelay } from '../utils/hash.js';

export class BilibiliAdapter extends BaseAdapter {
  constructor() {
    super('bilibili');
    this.http = axios.create({
      timeout: 15000,
      headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://www.bilibili.com' },
    });
  }

  async fetch({ query = '', limit = 30 } = {}) {
    await randomDelay(800, 2000);
    const items = [];
    try {
      // 热门榜
      const r1 = await this.http.get('https://api.bilibili.com/x/web-interface/popular', { params: { ps: 50, pn: 1 } });
      const list = r1.data?.data?.list || [];
      for (const v of list.slice(0, limit)) {
        items.push({
          source: this.name,
          external_id: v.bvid || v.aid?.toString(),
          url: v.short_link_v2 || (v.bvid ? `https://www.bilibili.com/video/${v.bvid}` : ''),
          title: v.title || '',
          content: v.desc || '',
          author: v.owner?.name || '',
          lang: 'zh',
          metrics: {
            likes: v.stat?.like || 0,
            shares: v.stat?.share || 0,
            views: v.stat?.view || 0,
            comments: v.stat?.reply || 0,
          },
          published_at: v.pubdate ? v.pubdate * 1000 : Date.now(),
        });
      }
    } catch { /* 静默 */ }

    // 如果有 query，再走搜索
    if (query) {
      try {
        const r2 = await this.http.get('https://api.bilibili.com/x/web-interface/search/type', {
          params: { search_type: 'video', keyword: query, page: 1, page_size: limit },
        });
        const list2 = r2.data?.data?.result || [];
        for (const v of list2) {
          items.push({
            source: this.name,
            external_id: v.bvid,
            url: v.arcurl || `https://www.bilibili.com/video/${v.bvid}`,
            title: v.title?.replace(/<[^>]+>/g, '') || '',
            content: v.description || '',
            author: v.author,
            lang: 'zh',
            metrics: { likes: v.like || 0, views: v.play || 0, comments: v.reply || 0 },
            published_at: v.pubdate ? v.pubdate * 1000 : Date.now(),
          });
        }
      } catch { /* 静默 */ }
    }
    return items.slice(0, limit);
  }
}
