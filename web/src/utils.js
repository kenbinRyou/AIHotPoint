// 工具
export function fmtTime(ts) {
  if (!ts) return '—';
  const d = new Date(ts);
  const now = Date.now();
  const diff = (now - ts) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s 前`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m 前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h 前`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}d 前`;
  return d.toLocaleDateString('zh-CN');
}

export function fmtNum(n) {
  if (!n && n !== 0) return '—';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return String(n);
}

export const SOURCE_LABELS = {
  twitter: 'Twitter / X',
  hackernews: 'Hacker News',
  bilibili: 'B 站',
  weibo: '微博热搜',
  bing: 'Bing',
  google: 'Google',
  duckduckgo: 'DuckDuckGo',
  sogou: '搜狗',
};

export const IMPORTANCE_CHIP = {
  urgent: 'chip-urgent',
  high: 'chip-high',
  medium: 'chip-medium',
  low: 'chip-low',
};

export const IMPORTANCE_LABEL = {
  urgent: '紧急',
  high: '重要',
  medium: '一般',
  low: '低优',
};
