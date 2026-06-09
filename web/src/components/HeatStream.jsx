// 实时热点流（左侧固定）
import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { fmtTime, SOURCE_LABELS, IMPORTANCE_LABEL } from '../utils.js';
import { TrendingUp } from 'lucide-react';

/**
 * 横向流：每 4s 拉取最新 5 条，从右侧滑入
 */
export default function HeatStream() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    let alive = true;
    const fetchOnce = async () => {
      try {
        const r = await api.listItems({ time_range: '1h', sort: 'fetched_desc', pageSize: 5 });
        if (alive) setItems(r.data || []);
      } catch {}
    };
    fetchOnce();
    const t = setInterval(fetchOnce, 5000);
    return () => { alive = false; clearInterval(t); };
  }, []);

  return (
    <div className="card p-4 overflow-hidden">
      <h3 className="text-xs font-mono uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2 mb-3">
        <TrendingUp className="w-3.5 h-3.5 text-cyan-300" />
        最近 1 小时热力流
      </h3>
      <div className="relative h-44 overflow-hidden">
        <div className="absolute inset-0 flex flex-col gap-1.5">
          {items.length === 0 && (
            <div className="text-xs font-mono text-slate-600">暂无数据，等待抓取…</div>
          )}
          {items.map((it) => (
            <a
              key={it.id}
              href={it.url}
              target="_blank"
              rel="noreferrer noopener"
              className="group flex items-center gap-3 px-3 py-2 rounded-md
                         bg-ink-900/60 border border-white/5 hover:border-plasma-400/40
                         transition-colors animate-slide-in"
            >
              <span className={`w-1.5 h-8 rounded-full heat-bar shrink-0`} />
              <div className="flex-1 min-w-0">
                <div className="text-[13px] text-slate-200 truncate group-hover:text-plasma-400">
                  {it.title}
                </div>
                <div className="text-[10px] font-mono text-slate-500 flex items-center gap-2 mt-0.5">
                  <span>{SOURCE_LABELS[it.source] || it.source}</span>
                  <span>·</span>
                  <span>{IMPORTANCE_LABEL[it.ai_importance] || '—'}</span>
                  <span>·</span>
                  <span>{fmtTime(it.fetched_at)}</span>
                </div>
              </div>
            </a>
          ))}
        </div>
        {/* 上下渐隐 */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-6 bg-gradient-to-b from-ink-800 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-ink-800 to-transparent" />
      </div>
    </div>
  );
}
