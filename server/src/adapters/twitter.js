// adapters/twitter.js
// 使用 twitterapi.io 提供的接口
import axios from 'axios';
import { BaseAdapter } from './base.js';
import { randomDelay } from '../utils/hash.js';

const BASE = process.env.TWITTER_API_BASE || 'https://api.twitterapi.io';
const KEY = process.env.TWITTER_API_KEY;

export class TwitterAdapter extends BaseAdapter {
  constructor() {
    super('twitter');
    this.http = axios.create({
      baseURL: BASE,
      headers: { 'X-API-Key': KEY, 'Content-Type': 'application/json' },
      timeout: 20000,
    });
  }

  /**
   * 抓取 Twitter 高级搜索结果
   * 文档：https://docs.twitterapi.io/api-reference/endpoint/tweet_advanced_search
   *   GET /twitter/tweet/advanced_search?query=...&queryType=Top&cursor=
   *   Header: X-API-Key: <api-key>
   */
  async fetch({ query = '', limit = 30 } = {}) {
    if (!KEY) throw new Error('TWITTER_API_KEY missing');
    await randomDelay(500, 1500);

    const q = (query || 'AI OR ChatGPT OR breaking').trim();
    const res = await this.http.get('/twitter/tweet/advanced_search', {
      params: { query: q, queryType: 'Top', cursor: '' },
    });
    const list = Array.isArray(res.data?.tweets) ? res.data.tweets : [];
    return list.slice(0, limit).map((t) => ({
      source: this.name,
      external_id: t.id || '',
      url: t.url || (t.author?.userName && t.id ? `https://x.com/${t.author.userName}/status/${t.id}` : ''),
      title: (t.text || '').slice(0, 200),
      content: t.text || '',
      author: t.author?.userName || t.inReplyToUsername || '',
      lang: t.lang || 'en',
      metrics: {
        likes: t.likeCount ?? 0,
        shares: t.retweetCount ?? 0,
        views: t.viewCount ?? 0,
        comments: t.replyCount ?? 0,
      },
      published_at: t.createdAt ? new Date(t.createdAt).getTime() : Date.now(),
    }));
  }
}
