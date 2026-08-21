import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { fmtTime, storyStatusChip } from '../utils.js';
import { ChevronRight } from 'lucide-react';

/**
 * HotSidePanel 右侧「当前热点」面板（对齐目标站首页右栏）
 * 故事线级 TOP 5，附趋势迷你图
 */
export default function HotSidePanel() {
  const [stories, setStories] = useState([]);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const r = await api.listStories({ limit: 5, time_range: '48h' });
        if (alive) setStories(r.data || []);
      } catch {}
    };
    load();
    const t = setInterval(load, 30000);
    return () => { alive = false; clearInterval(t); };
  }, []);

  if (stories.length === 0) return null;

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[15px] font-bold text-ink-900 flex items-center gap-1.5">
          <span className="w-4 h-4 rounded-full bg-teal-600 grid place-items-center">
            <span className="w-1.5 h-1.5 rounded-full bg-white" />
          </span>
          当前热点
        </h3>
        <Link
          to="/hot"
          className="text-[12px] text-teal-600 hover:text-teal-700 inline-flex items-center gap-0.5"
        >
          完整榜单
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <ol className="space-y-0.5">
        {stories.map((s, i) => {
          const chip = storyStatusChip(s.status);
          return (
            <li key={s.id}>
              <Link
                to={`/story/${s.id}`}
                className="flex items-start gap-2.5 px-2 py-2 rounded-lg hover:bg-paper-1 transition-colors group"
              >
                <span
                  className={`num text-[13px] font-semibold mt-0.5 w-4 shrink-0 text-center ${
                    i < 3 ? 'text-teal-600' : 'text-ink-500'
                  }`}
                >
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    {chip && <span className={chip.cls}>{chip.label}</span>}
                    <span className="text-[13px] leading-snug text-ink-900 group-hover:text-teal-600 transition-colors line-clamp-2">
                      {s.title}
                    </span>
                  </div>
                  <div className="mt-0.5 text-[11px] text-ink-500 num flex items-center gap-1.5">
                    <span>{Math.round(s.heat)} 热度</span>
                    {s.item_count > 1 && <span>· {s.item_count} 篇报道</span>}
                    <span>· {fmtTime(s.last_seen)}</span>
                  </div>
                </div>
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
