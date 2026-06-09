import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { SOURCE_LABELS } from '../utils.js';
import { Filter, RotateCcw } from 'lucide-react';

const SORTS = [
  { key: 'fetched_desc',     label: '最新发现' },
  { key: 'published_desc',   label: '最新发布' },
  { key: 'heat_desc',        label: '热度综合' },
  { key: 'importance_desc',  label: '重要程度' },
  { key: 'score_desc',       label: 'AI 相关性' },
];
const TIMES = [
  { key: '1h',  label: '1h' },
  { key: '6h',  label: '6h' },
  { key: '24h', label: '24h' },
  { key: '7d',  label: '7d' },
  { key: 'all', label: '全部' },
];
const IMPORTANCE = [
  { key: 'urgent', label: '紧急' },
  { key: 'high',   label: '重要' },
  { key: 'medium', label: '一般' },
  { key: 'low',    label: '低优' },
];

export default function FilterBar({ value, onChange, sources = [] }) {
  const [allSources, setAllSources] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    api.getSources().then((r) => setAllSources(r.data || [])).catch(() => {});
  }, []);

  const set = (patch) => onChange({ ...value, ...patch });

  const toggleArr = (arr, v) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-mono uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
          <Filter className="w-3.5 h-3.5" />
          筛选 / 排序
        </h3>
        <button className="text-[11px] text-slate-500 hover:text-slate-300 flex items-center gap-1"
                onClick={() => onChange({ sources: [], importance: [], time_range: '24h', sort: 'fetched_desc', keyword: '' })}>
          <RotateCcw className="w-3 h-3" /> 重置
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-mono text-slate-500 mr-1">时间</span>
        {TIMES.map((t) => (
          <button key={t.key}
            onClick={() => set({ time_range: t.key })}
            className={`px-2.5 py-1 rounded-md text-xs font-mono border ${
              value.time_range === t.key
                ? 'border-plasma-400/50 bg-plasma-500/15 text-plasma-400'
                : 'border-white/10 text-slate-400 hover:border-white/20'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-mono text-slate-500 mr-1">重要度</span>
        {IMPORTANCE.map((t) => (
          <button key={t.key}
            onClick={() => set({ importance: toggleArr(value.importance || [], t.key) })}
            className={`px-2.5 py-1 rounded-md text-xs font-mono border ${
              (value.importance || []).includes(t.key)
                ? 'border-cyan-400/50 bg-cyan-400/15 text-cyan-300'
                : 'border-white/10 text-slate-400 hover:border-white/20'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-mono text-slate-500 mr-1">来源</span>
        {allSources.map((s) => (
          <button key={s.key}
            onClick={() => set({ sources: toggleArr(value.sources || [], s.key) })}
            className={`px-2.5 py-1 rounded-md text-xs font-mono border ${
              (value.sources || []).includes(s.key)
                ? 'border-cyan-400/50 bg-cyan-400/15 text-cyan-300'
                : 'border-white/10 text-slate-400 hover:border-white/20'
            }`}>
            {SOURCE_LABELS[s.key] || s.key}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-mono text-slate-500 mr-1">排序</span>
        {SORTS.map((t) => (
          <button key={t.key}
            onClick={() => set({ sort: t.key })}
            className={`px-2.5 py-1 rounded-md text-xs font-mono border ${
              value.sort === t.key
                ? 'border-heat-5/60 bg-heat-5/10 text-orange-300'
                : 'border-white/10 text-slate-400 hover:border-white/20'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <input
          type="text"
          placeholder="搜索标题/内容/AI 摘要/关键词…"
          value={value.keyword || ''}
          onChange={(e) => set({ keyword: e.target.value })}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && value.keyword) {
              navigate(`/search?q=${encodeURIComponent(value.keyword)}`);
            }
          }}
          className="flex-1 bg-ink-900/60 border border-white/10 rounded-md px-3 py-1.5 text-sm
                     placeholder:text-slate-600 focus:outline-none focus:border-plasma-400/40"
        />
        <button
          type="button"
          onClick={() => value.keyword && navigate(`/search?q=${encodeURIComponent(value.keyword)}`)}
          className="px-2 py-1.5 rounded-md text-[11px] font-mono border border-plasma-400/40 bg-plasma-500/10 text-plasma-300 hover:bg-plasma-500/20"
          title="去搜索页实时抓取">
          实时搜
        </button>
      </div>
    </div>
  );
}
