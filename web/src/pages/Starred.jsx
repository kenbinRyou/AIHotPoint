import { Link } from 'react-router-dom';
import { Star, ExternalLink, Clock } from 'lucide-react';
import { useStars, toggleStar } from '../store.js';
import { fmtTime, fmtScore, SOURCE_LABELS, IMPORTANCE_LABEL, detailUrl } from '../utils.js';

/**
 * 收藏页（对齐目标站 /starred）
 * 本机 localStorage 存储，不上传、不同步
 */
export default function Starred() {
  const stars = useStars();

  return (
    <div className="max-w-[720px] mx-auto px-4 sm:px-6 pt-6">
      {/* 页头 */}
      <div className="mb-5">
        <h1 className="text-[26px] font-bold tracking-tight leading-none flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-lg bg-teal-600 grid place-items-center">
            <Star className="w-4 h-4 text-white" fill="currentColor" />
          </span>
          收藏
        </h1>
        <p className="mt-2 text-[13px] text-ink-500">
          本机收藏的内容，适合稍后阅读和回看。
        </p>
      </div>

      {stars.length === 0 ? (
        <div className="card p-12 text-center text-ink-500">
          <Star className="w-6 h-6 mx-auto mb-3 opacity-40" />
          <div className="text-[14px] font-medium text-ink-900 mb-1">还没有收藏内容</div>
          <div className="text-[12.5px]">
            点开任意一条内容，在卡片或详情页点击星标即可收藏。
          </div>
          <Link to="/" className="btn-primary text-[13px] mt-5 inline-flex">去逛精选</Link>
        </div>
      ) : (
        <>
          <div className="text-[12px] text-ink-500 num mb-3">{stars.length} 条收藏</div>
          <div className="space-y-2.5">
            {stars.map((s) => {
              const score = fmtScore(s.ai_score);
              return (
                <article key={s.id} className="card-hover p-3 sm:p-[14px] group animate-slide-in">
                  <div className="flex items-center gap-2 flex-wrap mb-1.5 text-[12px]">
                    <span className="text-ink-700">{SOURCE_LABELS[s.source] || s.source}</span>
                    {s.ai_importance && (
                      <span className="chip-neutral">{IMPORTANCE_LABEL[s.ai_importance]}</span>
                    )}
                    <span className="ml-auto flex items-center gap-1">
                      {score !== null && (
                        <span className={`score ${score >= 80 ? 'score-high' : ''}`}>
                          AI 评分 {score}
                          <span className="text-[10px] opacity-70">/100</span>
                        </span>
                      )}
                      <button
                        onClick={() => toggleStar(s)}
                        className="star-btn star-btn-on"
                        title="取消收藏"
                        aria-label="取消收藏"
                      >
                        <Star size={15} fill="currentColor" strokeWidth={2} />
                      </button>
                    </span>
                  </div>

                  <Link
                    to={detailUrl(s.id, '/starred')}
                    className="block text-[16px] font-semibold leading-snug text-ink-900
                               group-hover:text-teal-600 transition-colors"
                  >
                    {s.title}
                  </Link>

                  {s.ai_summary && (
                    <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-700 line-clamp-2">
                      {s.ai_summary}
                    </p>
                  )}

                  <div className="mt-2.5 flex items-center gap-3 text-[11.5px] text-ink-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      收藏于 {fmtTime(s.starredAt)}
                    </span>
                    {s.url && (
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="ml-auto inline-flex items-center gap-1 text-teal-600 hover:text-teal-700"
                        title="打开原文"
                      >
                        原文
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
