import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api.js';
import {
  fmtTime, fmtScore, fmtClock, SOURCE_LABELS, IMPORTANCE_LABEL, storyStatusChip, detailUrl,
} from '../utils.js';
import Sparkline from '../components/Sparkline.jsx';
import StarButton from '../components/StarButton.jsx';
import { Loader2, ChevronLeft } from 'lucide-react';

/** 热度走势大图（近 24h，纯 SVG 折线 + 面积） */
function TrendChart({ points }) {
  const sorted = [...points].sort((a, b) => a.ts - b.ts);
  const W = 640, H = 120;
  if (sorted.length < 2) {
    return (
      <div className="text-[12px] text-ink-500 py-8 text-center">
        采样中——热度走势需要至少两次小时级采样，稍后再来看看
      </div>
    );
  }
  const values = sorted.map((p) => p.heat);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const stepX = W / (sorted.length - 1);
  const y = (v) => 8 + (H - 16) * (1 - (v - min) / span);
  const path = sorted
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${(i * stepX).toFixed(1)},${y(p.heat).toFixed(1)}`)
    .join(' ');
  const area = `${path} L${W},${H} L0,${H} Z`;
  const rising = values[values.length - 1] >= values[0];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-[120px]" role="img"
      aria-label={`近 24 小时事件热度走势，${rising ? '整体上升' : '整体下降'}`}>
      <path d={area} fill="var(--accent)" opacity="0.1" />
      <path d={path} fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {sorted.map((p, i) => (
        <circle key={p.ts} cx={i * stepX} cy={y(p.heat)} r="2.5" fill="var(--accent)" />
      ))}
    </svg>
  );
}

/**
 * 故事线详情页（对齐目标站 /story/:id）
 * 事件全貌（AI 综述）+ 热度走势 + 报道时间线
 */
export default function StoryDetail() {
  const { id } = useParams();
  const [story, setStory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError('');
    api.getStory(id)
      .then((r) => { if (alive) setStory(r.data || null); })
      .catch((e) => { if (alive) setError(e.message || '加载失败'); })
      .finally(() => { if (alive) setLoading(false); });
    window.scrollTo(0, 0);
    return () => { alive = false; };
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-[720px] mx-auto px-4 sm:px-6 py-24 grid place-items-center text-ink-500">
        <Loader2 className="w-5 h-5 animate-spin mb-2" />
        <span className="text-[13px]">加载中…</span>
      </div>
    );
  }

  if (error || !story) {
    return (
      <div className="max-w-[720px] mx-auto px-4 sm:px-6 py-24 text-center">
        <div className="text-[15px] font-medium text-ink-900 mb-1.5">事件不存在</div>
        <div className="text-[12.5px] text-ink-500 mb-5">{error}</div>
        <Link to="/hot" className="btn-primary text-[13px]">返回热点榜</Link>
      </div>
    );
  }

  const chip = storyStatusChip(story.status);
  const duration = story.last_seen - story.first_seen;
  const durationLabel =
    duration < 3600_000 ? `${Math.max(1, Math.round(duration / 60_000))} 分钟`
    : duration < 86400_000 ? `${Math.round(duration / 3600_000)} 小时`
    : `${Math.round(duration / 86400_000)} 天`;
  const peak = story.trend.length
    ? Math.max(...story.trend.map((t) => t.heat))
    : story.peak_heat;

  return (
    <div className="max-w-[720px] mx-auto px-4 sm:px-6 pt-6 pb-4">
      {/* 返回 */}
      <Link
        to="/hot"
        className="inline-flex items-center gap-1 text-[12.5px] text-ink-500 hover:text-teal-600 mb-5"
      >
        <ChevronLeft className="w-3.5 h-3.5" />
        返回热点榜
      </Link>

      {/* 事件头 */}
      <div className="text-[11px] font-mono uppercase tracking-[0.25em] text-teal-600 mb-2">
        Story · {story.item_count > 1 ? '事件进行中' : '单源报道'}
      </div>
      <h1 className="text-[24px] sm:text-[27px] font-bold leading-snug tracking-tight text-ink-900">
        {story.title}
      </h1>
      <div className="mt-2.5 text-[12.5px] text-ink-500 num flex items-center gap-2 flex-wrap">
        <span>{story.item_count} 篇报道</span>
        <span>·</span>
        <span>持续 {durationLabel}</span>
        <span>·</span>
        <span>最新动态 {fmtTime(story.last_seen)}</span>
      </div>

      {/* 多源信源列表 */}
      {story.source_count > 1 && (
        <div className="mt-3 flex items-center gap-1.5 flex-wrap text-[11.5px] text-ink-500">
          <span>另有 {story.source_count} 家信源报道：</span>
          {story.sources?.map((src) => (
            <span key={src} className="chip-neutral">{SOURCE_LABELS[src] || src}</span>
          ))}
        </div>
      )}

      {/* 事件全貌（AI 综述） */}
      {story.digest && (
        <section className="mt-6">
          <div className="text-[11px] font-mono uppercase tracking-[0.25em] text-ink-500 mb-2">
            Digest · 事件全貌
          </div>
          <div className="card p-4 bg-teal-100">
            <p className="text-[13.5px] leading-relaxed text-ink-900">{story.digest}</p>
            <div className="mt-2 text-[11px] text-ink-500">
              AI 综述 · 汇总全部报道生成，随事件进展持续更新
            </div>
          </div>
        </section>
      )}

      {/* 热度走势 */}
      <section className="mt-6">
        <div className="text-[11px] font-mono uppercase tracking-[0.25em] text-ink-500 mb-2">
          24 Hours · 本事件热度走势
        </div>
        <div className="card p-4">
          <div className="flex items-baseline gap-3 mb-3 text-[12.5px] text-ink-500 num">
            <span>当前热度 <strong className="text-ink-900 text-[15px]">{Math.round(story.heat)}</strong></span>
            <span>峰值 <strong className="text-ink-700">{Math.round(peak)}</strong></span>
          </div>
          <TrendChart points={story.trend} />
        </div>
      </section>

      {/* 报道时间线 */}
      <section className="mt-6">
        <div className="text-[11px] font-mono uppercase tracking-[0.25em] text-ink-500 mb-2">
          Timeline · 报道时间线
        </div>
        <div className="card overflow-hidden">
          <div className="px-4 py-3 border-b border-paper-2 text-[12.5px] text-ink-500">
            {story.items.length} 条报道 · 最新在前
          </div>
          <ol className="divide-y divide-paper-2">
            {story.items.map((it) => {
              const score = fmtScore(it.ai_score);
              return (
                <li key={it.id} className="group">
                  <Link
                    to={detailUrl(it.id, `/story/${story.id}`)}
                    className="flex gap-3 px-4 py-3.5 hover:bg-paper-1/60 transition-colors"
                  >
                    <time className="text-[11.5px] text-ink-500 num shrink-0 pt-0.5 w-[72px]">
                      {fmtClock(it.fetched_at)}
                    </time>
                    <div className="min-w-0 flex-1">
                      <div className="text-[14.5px] font-semibold leading-snug text-ink-900 group-hover:text-teal-600 transition-colors">
                        {it.title}
                      </div>
                      <div className="mt-1 flex items-center gap-2 flex-wrap text-[11.5px] text-ink-500">
                        <span>{SOURCE_LABELS[it.source] || it.source}</span>
                        {it.ai_importance && (
                          <>
                            <span>·</span>
                            <span>{IMPORTANCE_LABEL[it.ai_importance]}</span>
                          </>
                        )}
                        {score !== null && (
                          <>
                            <span>·</span>
                            <span className="text-teal-600 font-medium">AI {score} 分</span>
                          </>
                        )}
                      </div>
                      {it.ai_summary && (
                        <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-700 line-clamp-2">
                          {it.ai_summary}
                        </p>
                      )}
                    </div>
                    <span className="shrink-0 pt-1" onClick={(e) => e.preventDefault()}>
                      <StarButton item={it} size={14} />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ol>
        </div>
      </section>
    </div>
  );
}
