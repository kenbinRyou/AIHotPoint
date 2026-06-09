// adapters/hackernews.js
// 官方 Algolia 搜索 API，无需 key
import axios from 'axios';
import { BaseAdapter } from './base.js';
import { randomDelay } from '../utils/hash.js';

const SEARCH = 'https://hn.algolia.com/api/v1/search';
const TOP = 'https://hn.algolia.com/api/v1/search_by_date';

export class HackerNewsAdapter extends BaseAdapter {
  constructor() {
    super('hackernews');
    this.http = axios.create({ timeout: 15000 });
  }

  async fetch({ query = '', limit = 30 } = {}) {
    await randomDelay(300, 800);
    const url = query ? SEARCH : TOP;
    const params = query
      ? { query, tags: 'story', hitsPerPage: limit }
      : { tags: 'story', hitsPerPage: limit };
    const res = await this.http.get(url, { params });
    const hits = res.data?.hits || [];
    return hits.map((h) => ({
      source: this.name,
      external_id: h.objectID,
      url: h.url || `https://news.ycombinator.com/item?id=${h.objectID}`,
      title: h.title || h.story_title || '(无标题)',
      content: h.story_text || h.title || '',
      author: h.author || '',
      lang: 'en',
      metrics: { likes: h.points || 0, shares: 0, views: 0, comments: h.num_comments || 0 },
      published_at: h.created_at_i ? h.created_at_i * 1000 : Date.now(),
    }));
  }
}
