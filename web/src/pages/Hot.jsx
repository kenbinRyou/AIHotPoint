import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { fmtTime, SOURCE_LABELS, storyStatusChip } from '../utils.js';
import Sparkline from '../components/Sparkline.jsx';
import { Loader2 } from 'lucide-react';

/**
 * 热点榜（对齐目标站 /hot：HOT RADAR）
 * 故事线级榜单：同一事件多源报道聚合后的综合热度，附 24h 趋势
 */
export default function Hot() {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const r = await api.listStories({ limit: 20, time_range: '48h' });
        if (alive) setStories(r.data || []);
      } catch {
        if (alive) setStories([]);
      } finally {
        if (alive) setLoading(false);
      }
    };
    load();
    const t = setInterval(load, 60000);
    return () => { alive = false; clearInterval(t); };
  }, []);

  return (
    <div className="max-w-[720px] mx-auto px-4 sm:px-6 pt-6">
      {/* 页头 */}
      <div className="mb-5">
        <div className="text-[11px] font-mono uppercase tracking-[0.25em] text-teal-600 mb-1.5">
          Hot Radar
        </div>
        <h1 className="text-[26px] font-bold tracking-tight leading-none">AI 热点榜</h1>
        <p className="mt-2 text-[13px] text-ink-500">
          过去 48 小时最热的 AI 事件，多源报道聚合后的综合热度实时排序。
        </p>
      </div>

      {loading ? (
        <div className="card rounded-panel py-24 grid place-items-center text-ink-500">
          <Loader2 className="w-5 h-5 animate-spin mb-2" />
          <span className="text-[13px]">加载中…</span>
        </div>
      ) : stories.length === 0 ? (
        <div className="card rounded-panel p-12 text-center text-ink-500">
          <div className="text-[14px] font-medium text-ink-900 mb-1">48 小时内暂无事件</div>
          <div className="text-[12.5px]">去首页点「手动抓取」拉取最新内容</div>
        </div>
      ) : (
        <div className="card rounded-panel overflow-hidden">
          {/* 榜头 */}
          <header className="flex items-center gap-2.5 px-5 py-4 border-b border-paper-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse-dot" />
            <span className="text-[11px] font-mono uppercase tracking-widest text-ink-500">Now</span>
            <span className="text-[15px] font-bold text-ink-900">当前热点</span>
            <span className="text-[12px] text-ink-500 ml-auto num">{stories.length} 个事件</span>
          </header>

          {/* 榜单 */}
          <ol className="divide-y divide-paper-2">
            {stories.map((s, i) => {
              const chip = storyStatusChip(s.status);
              return (
                <li key={s.id} className="group">
                  <Link
                    to={`/story/${s.id}`}
                    className="flex items-center gap-3.5 px-5 py-3.5 hover:bg-paper-1/60 transition-colors"
                  >
                    <span
                      className={`num text-[15px] font-semibold w-7 shrink-0 text-center ${
                        i < 3 ? 'text-teal-600' : 'text-ink-500'
                      }`}
                    >
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {chip && <span className={chip.cls}>{chip.label}</span>}
                        <span className="text-[15.5px] font-semibold leading-snug text-ink-900 group-hover:text-teal-600 transition-colors line-clamp-2">
                          {s.title}
                        </span>
                      </div>
                      <div className="mt-1 text-[11.5px] text-ink-500 flex items-center gap-2 flex-wrap">
                        <span>{SOURCE_LABELS[s.first_source] || s.first_source || '多源'}</span>
                        <span>·</span>
                        <span>{fmtTime(s.first_seen)}</span>
                        {s.item_count > 1 && (
                          <>
                            <span>·</span>
                            <span className="text-ink-700 font-medium">{s.item_count} 篇报道</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <Sparkline points={s.trend} width={64} height={22} />
                      <span className="text-[12px] font-semibold num text-ink-700">
                        {Math.round(s.heat)}
                        <span className="text-[10px] font-normal text-ink-500 ml-0.5">热度</span>
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ol>

          {/* 算法说明 */}
          <footer className="px-5 py-3.5 bg-paper-1/70 text-[11.5px] text-ink-500 leading-relaxed">
            事件热度 = 成员条目（点赞 + 转发×2 + 浏览×0.01 + AI 评分×1000）之和。
            标签含义：<span className="text-red-500">爆</span> 短时间密集报道、
            <span className="text-yellow-600">新</span> 首报 6 小时内、
            <span className="text-teal-600">发酵中</span> 信源仍在增加。
            同一事件的多源报道聚合为一个故事线，点击查看事件全貌与报道时间线。
          </footer>
        </div>
      )}
    </div>
  );
}
