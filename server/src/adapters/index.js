// adapters/index.js
// 适配器注册表
import { TwitterAdapter } from './twitter.js';
import { BingAdapter } from './bing.js';
import { GoogleAdapter } from './google.js';
import { DuckDuckGoAdapter } from './duckduckgo.js';
import { HackerNewsAdapter } from './hackernews.js';
import { SogouAdapter } from './sogou.js';
import { BilibiliAdapter } from './bilibili.js';
import { WeiboAdapter } from './weibo.js';

export const ADAPTERS = {
  twitter: TwitterAdapter,
  bing: BingAdapter,
  google: GoogleAdapter,
  duckduckgo: DuckDuckGoAdapter,
  hackernews: HackerNewsAdapter,
  sogou: SogouAdapter,
  bilibili: BilibiliAdapter,
  weibo: WeiboAdapter,
};

export const SOURCE_META = [
  { key: 'twitter',    label: 'Twitter / X', icon: 'Twitter' },
  { key: 'hackernews', label: 'Hacker News', icon: 'Hash' },
  { key: 'bilibili',   label: 'B 站', icon: 'Tv' },
  { key: 'weibo',      label: '微博热搜', icon: 'Flame' },
  { key: 'bing',       label: 'Bing', icon: 'Search' },
  { key: 'google',     label: 'Google', icon: 'Search' },
  { key: 'duckduckgo', label: 'DuckDuckGo', icon: 'Bird' },
  { key: 'sogou',      label: '搜狗', icon: 'Search' },
];

export function getAdapter(name) {
  const Cls = ADAPTERS[name];
  if (!Cls) return null;
  return new Cls();
}
