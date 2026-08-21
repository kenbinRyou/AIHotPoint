// API 客户端
const BASE = ''; // 通过 vite proxy 转发

async function http(path, opts = {}) {
  const res = await fetch(BASE + path, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
  }
  return res.json();
}

export const api = {
  health: () => http('/api/health'),
  listItems: (params = {}) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== '' && v !== undefined && v !== null) q.set(k, v);
    });
    return http('/api/items?' + q.toString());
  },
  getSources: () => http('/api/items/sources'),
  getStats: () => http('/api/items/stats'),
  getItem: (id) => http(`/api/items/${id}`),
  search: (body) => http('/api/search', { method: 'POST', body: JSON.stringify(body) }),
  listKeywords: () => http('/api/keywords'),
  addKeyword: (keyword) => http('/api/keywords', { method: 'POST', body: JSON.stringify({ keyword }) }),
  delKeyword: (id) => http(`/api/keywords/${id}`, { method: 'DELETE' }),
  triggerCrawl: (source) =>
    http('/api/crawl/trigger', { method: 'POST', body: JSON.stringify({ source: source || '' }) }),
  triggerAnalyze: () => http('/api/crawl/analyze', { method: 'POST', body: '{}' }),
  // 故事线
  listStories: (params = {}) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== '' && v !== undefined && v !== null) q.set(k, v);
    });
    return http('/api/stories?' + q.toString());
  },
  getStory: (id) => http(`/api/stories/${id}`),
  // AI 日报
  getDailyLatest: (date) =>
    http('/api/daily/latest' + (date ? `?date=${date}` : '')),
  getDaily: (date) => http(`/api/daily/${date}`),
  listDaily: () => http('/api/daily'),
  // 主题
  listTopics: () => http('/api/topics'),
  getTopicItems: (key, params = {}) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== '' && v !== undefined && v !== null) q.set(k, v);
    });
    return http(`/api/topics/${key}?` + q.toString());
  },
  // 反馈
  submitFeedback: (body) =>
    http('/api/feedback', { method: 'POST', body: JSON.stringify(body) }),
  // 周报
  getWeeklyLatest: (issue) => http('/api/weekly/latest' + (issue ? `?issue=${issue}` : '')),
  getWeekly: (issue) => http(`/api/weekly/${issue}`),
  listWeekly: () => http('/api/weekly'),
  // 月报
  getMonthlyLatest: (issue) => http('/api/monthly/latest' + (issue ? `?issue=${issue}` : '')),
  getMonthly: (issue) => http(`/api/monthly/${issue}`),
  listMonthly: () => http('/api/monthly'),
};
