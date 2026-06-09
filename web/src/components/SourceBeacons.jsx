import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { SOURCE_LABELS } from '../utils.js';
import { Activity } from 'lucide-react';

/**
 * SourceBeacons
 * 8 个数据源的"心跳灯"。亮起 = 最近被命中 / 当前正在抓取
 */
export default function SourceBeacons({ stats, onTrigger }) {
  const [beacons, setBeacons] = useState({});
  useEffect(() => {
    const t = setInterval(async () => {
      try {
        const r = await api.getStats();
        const map = {};
        (r.data?.bySource || []).forEach((s) => { map[s.source] = s.c; });
        setBeacons(map);
      } catch {}
    }, 6000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-mono uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
          <Activity className="w-3.5 h-3.5" />
          源站心跳
        </h3>
        <button className="btn text-xs" onClick={onTrigger}>
          手动抓取
        </button>
      </div>
      <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
        {Object.keys(SOURCE_LABELS).map((k) => {
          const c = beacons[k] || 0;
          const active = c > 0;
          return (
            <div key={k} className="flex flex-col items-center gap-1.5">
              <div className={`relative w-10 h-10 rounded-full grid place-items-center border ${active ? 'border-cyan-400/50 animate-glow' : 'border-white/10'} bg-ink-800`}>
                <div className={`w-3 h-3 rounded-full ${active ? 'bg-cyan-400' : 'bg-slate-700'}`} />
                {active && <span className="absolute inset-0 rounded-full bg-cyan-400/10 animate-pulse-fast" />}
              </div>
              <span className="text-[10px] font-mono text-slate-500 num">{c}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
