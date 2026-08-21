// adapters/index.js
// 适配器注册表
// RSS 信源 + 社交平台 = 主信源（scheduler 自动抓取）
// 搜索引擎 = 搜索功能专用（不自动抓取，仅搜索页调用）
import { TwitterAdapter } from './twitter.js';
import { BingAdapter } from './bing.js';
import { GoogleAdapter } from './google.js';
import { DuckDuckGoAdapter } from './duckduckgo.js';
import { HackerNewsAdapter } from './hackernews.js';
import { SogouAdapter } from './sogou.js';
import { BilibiliAdapter } from './bilibili.js';
import { WeiboAdapter } from './weibo.js';
import { RssFeedAdapter } from './rss.js';
import { RSS_SOURCES } from './rss-sources.js';
import { PageScraperAdapter } from './page.js';
import { PAGE_SOURCES } from './page-sources.js';

// RSS 适配器实例（需传入 feed 配置，预先创建）
const rssAdapters = {};
RSS_SOURCES.forEach((s) => {
  rssAdapters[s.key] = new RssFeedAdapter(s);
});

// 页面爬取适配器实例（需传入 extractItems，预先创建）
const pageAdapters = {};
PAGE_SOURCES.forEach((s) => {
  pageAdapters[s.key] = new PageScraperAdapter(s);
});

// ADAPTERS 注册表：RSS / 页面爬取 为实例，其他为类
export const ADAPTERS = {
  ...rssAdapters,
  ...pageAdapters,
  // 社交平台（主信源）
  twitter: TwitterAdapter,
  hackernews: HackerNewsAdapter,
  bilibili: BilibiliAdapter,
  weibo: WeiboAdapter,
  // 搜索引擎（搜索功能专用）
  bing: BingAdapter,
  google: GoogleAdapter,
  duckduckgo: DuckDuckGoAdapter,
  sogou: SogouAdapter,
};

// 信源分类
export const SOURCE_CATEGORIES = {
  'ai-official': 'AI 公司官方',
  'tech-media': '科技媒体',
  community: '社区/论文',
  social: '社交平台',
  'search-engine': '搜索引擎',
};

// role: feed = 主信源（自动抓取）；search = 搜索功能专用
export const SOURCE_META = [
  // 页面爬取信源（主信源）
  ...PAGE_SOURCES.map((s) => ({
    key: s.key,
    label: s.label,
    category: s.category,
    role: 'feed',
    icon: 'Globe',
  })),
  // RSS 信源（主信源）
  ...RSS_SOURCES.map((s) => ({
    key: s.key,
    label: s.label,
    category: s.category,
    role: 'feed',
    icon: 'Rss',
  })),
  // 社交平台（主信源）
  { key: 'twitter', label: 'Twitter / X', category: 'social', role: 'feed', icon: 'Twitter' },
  { key: 'hackernews', label: 'Hacker News', category: 'community', role: 'feed', icon: 'Hash' },
  { key: 'bilibili', label: 'B 站', category: 'social', role: 'feed', icon: 'Tv' },
  { key: 'weibo', label: '微博热搜', category: 'social', role: 'feed', icon: 'Flame' },
  // 搜索引擎（搜索功能专用）
  { key: 'bing', label: 'Bing', category: 'search-engine', role: 'search', icon: 'Search' },
  { key: 'google', label: 'Google', category: 'search-engine', role: 'search', icon: 'Search' },
  { key: 'duckduckgo', label: 'DuckDuckGo', category: 'search-engine', role: 'search', icon: 'Bird' },
  { key: 'sogou', label: '搜狗', category: 'search-engine', role: 'search', icon: 'Search' },
];

/** 主信源 key 列表（scheduler 只抓这些） */
export const FEED_SOURCE_KEYS = SOURCE_META.filter((s) => s.role === 'feed').map((s) => s.key);

/** 获取信源元信息 */
export function getSourceMeta(key) {
  return SOURCE_META.find((s) => s.key === key) || null;
}

/** 获取适配器实例：RSS 为预创建实例，其他按需 new */
const instances = {};
export function getAdapter(name) {
  if (instances[name]) return instances[name];
  const entry = ADAPTERS[name];
  if (!entry) return null;
  // 已是实例（RSS 适配器）
  if (typeof entry.fetch === 'function') {
    instances[name] = entry;
    return entry;
  }
  // 类：new 一个实例
  instances[name] = new entry();
  return instances[name];
}
