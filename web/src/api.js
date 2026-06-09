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
  search: (body) => http('/api/search', { method: 'POST', body: JSON.stringify(body) }),
  listKeywords: () => http('/api/keywords'),
  addKeyword: (keyword) => http('/api/keywords', { method: 'POST', body: JSON.stringify({ keyword }) }),
  delKeyword: (id) => http(`/api/keywords/${id}`, { method: 'DELETE' }),
  triggerCrawl: (source) =>
    http('/api/crawl/trigger', { method: 'POST', body: JSON.stringify({ source: source || '' }) }),
  triggerAnalyze: () => http('/api/crawl/analyze', { method: 'POST', body: '{}' }),
};
