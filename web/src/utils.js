// 工具
export function fmtTime(ts) {
  if (!ts) return '—';
  const diff = (Date.now() - ts) / 1000;
  if (diff < 60) return `${Math.max(1, Math.floor(diff))}分钟前`;
  if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}天前`;
  return new Date(ts).toLocaleDateString('zh-CN');
}

export function fmtClock(ts) {
  if (!ts) return '—';
  const d = new Date(ts);
  const p = (n) => String(n).padStart(2, '0');
  return `${p(d.getHours())}:${p(d.getMinutes())}`;
}

export function fmtNum(n) {
  if (!n && n !== 0) return '—';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return String(n);
}

/** AI score (0~1 浮点) → 0~100 编辑部评分 */
export function fmtScore(score) {
  if (typeof score !== 'number') return null;
  if (score <= 1) return Math.round(score * 100);
  return Math.round(score);
}

/** 按天分组：返回 [{ key, label, sub, items }]，最新在前 */
export function groupByDay(items, timeField = 'fetched_at') {
  const groups = [];
  const map = new Map();
  const now = new Date();
  const todayKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
  const yesterday = new Date(now.getTime() - 86400_000);
  const yesterdayKey = `${yesterday.getFullYear()}-${yesterday.getMonth()}-${yesterday.getDate()}`;
  const WEEK = ['日', '一', '二', '三', '四', '五', '六'];

  items.forEach((it) => {
    const ts = it[timeField] || it.fetched_at;
    if (!ts) return;
    const d = new Date(ts);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    if (!map.has(key)) {
      let label, sub;
      if (key === todayKey) {
        label = '今天';
        sub = `${d.getMonth() + 1}月${d.getDate()}日`;
      } else if (key === yesterdayKey) {
        label = '昨天';
        sub = `${d.getMonth() + 1}月${d.getDate()}日`;
      } else {
        label = `${d.getMonth() + 1}月${d.getDate()}日`;
      }
      const g = { key, label, sub, weekday: `周${WEEK[d.getDay()]}`, items: [] };
      map.set(key, g);
      groups.push(g);
    }
    map.get(key).items.push(it);
  });
  return groups;
}

export const SOURCE_LABELS = {
  // AI 公司官方（页面爬取）
  anthropic: 'Anthropic',
  // AI 公司官方（RSS）
  'google-ai': 'Google AI',
  // 社区/论文
  huggingface: 'Hugging Face',
  'arxiv-ai': 'arXiv AI',
  'arxiv-ml': 'arXiv ML',
  'arxiv-cl': 'arXiv CL',
  // 科技媒体
  techcrunch: 'TechCrunch',
  'the-verge': 'The Verge',
  'the-decoder': 'The Decoder',
  'mit-tech-review': 'MIT Tech Review',
  ithome: 'IT之家',
  'ai-news': 'AI News',
  'last-week-in-ai': 'Last Week in AI',
  'unite-ai': 'Unite.ai',
  marktechpost: 'MarkTechPost',
  // 社交平台
  twitter: 'X / Twitter',
  hackernews: 'Hacker News',
  bilibili: 'B 站',
  weibo: '微博热搜',
  // 搜索引擎
  bing: 'Bing',
  google: 'Google',
  duckduckgo: 'DuckDuckGo',
  sogou: '搜狗',
};

// 信源分类标签（对齐 AIHOT 的信源分类）
export const SOURCE_CATEGORY_LABELS = {
  'ai-official': 'AI 公司官方',
  'tech-media': '科技媒体',
  community: '社区/论文',
  social: '社交平台',
  'search-engine': '搜索引擎',
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

// AI 分类体系（对齐目标站：模型/产品/行业/论文/教程/观点）
export const CATEGORY_LABELS = {
  'ai-models': '模型',
  'ai-products': '产品',
  industry: '行业',
  paper: '论文',
  tip: '教程',
  opinion: '观点',
};

/** 分类 slug → 中文标签；未知值原样返回 */
export function categoryLabel(v) {
  if (!v) return '';
  return CATEGORY_LABELS[v] || v;
}

/** 故事线状态标签（后端 status 字段） */
export function storyStatusChip(status) {
  switch (status) {
    case '爆': return { label: '爆', cls: 'chip-urgent' };
    case '新': return { label: '新', cls: 'chip-medium' };
    case '发酵中': return { label: '发酵中', cls: 'chip-low' };
    default: return null;
  }
}

/** 热度标签（对齐目标站：爆 / 新 / 发酵中） */
export function heatTag(item) {
  if (item.ai_importance === 'urgent') return { label: '爆', cls: 'chip-urgent' };
  const diff = (Date.now() - (item.fetched_at || 0)) / 1000;
  if (diff < 6 * 3600) return { label: '新', cls: 'chip-medium' };
  if (item.ai_importance === 'high') return { label: '发酵中', cls: 'chip-low' };
  return null;
}

/** 综合热度值（与后端 heat_desc 排序口径一致） */
export function heatValue(item) {
  const m = item.metrics || {};
  return Math.round(
    (m.likes || 0) + (m.shares || 0) * 2 + (m.views || 0) * 0.01 + (item.ai_score || 0) * 1000,
  );
}

/** 页头日期（对齐目标站：8月19日 · 周三） */
export function todayLabel() {
  const d = new Date();
  const WEEK = ['日', '一', '二', '三', '四', '五', '六'];
  return `${d.getMonth() + 1}月${d.getDate()}日 · 周${WEEK[d.getDay()]}`;
}

/** 详情页链接：携带 from 参数，详情页「返回」回到来源列表 */
export function detailUrl(id, from) {
  if (!id) return '';
  return from ? `/items/${id}?from=${encodeURIComponent(from)}` : `/items/${id}`;
}
