import { Link, useLocation } from 'react-router-dom';
import { ExternalLink, Clock } from 'lucide-react';
import { fmtClock, fmtTime, fmtScore, SOURCE_LABELS, IMPORTANCE_LABEL, categoryLabel, detailUrl } from '../utils.js';
import StarButton from './StarButton.jsx';

/**
 * TimelineCard 信息流卡片（对齐目标站 timeline-card）
 * 结构：时间 · 信源 · AI 评分 · 收藏 → 标题 → AI 摘要 → 关键词标签 / 元信息
 */
export default function TimelineCard({ item, featured = false }) {
  const location = useLocation();
  const score = fmtScore(item.ai_score);
  const summary = item.ai_summary || item.content || '';
  const from = location.pathname.startsWith('/all') || location.pathname === '/'
    ? location.pathname + location.search
    : '';
  const isFeaturedTop = featured && item.ai_importance && ['urgent', 'high'].includes(item.ai_importance);

  return (
    <article className="card-hover p-3 sm:p-[14px] group animate-slide-in">
      {/* 顶行：时间 · 信源 · 精选 · 重要度 · 评分 + 收藏 */}
      <div className="flex items-center gap-2 flex-wrap mb-1.5 text-[12px]">
        <span className="num text-ink-700">{fmtClock(item.fetched_at)}</span>
        <span className="text-ink-500">·</span>
        <span className="text-ink-700">{SOURCE_LABELS[item.source] || item.source}</span>
        {isFeaturedTop && (
          <span className="chip" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
            精选
          </span>
        )}
        {item.ai_importance && (
          <span className="chip-neutral">{IMPORTANCE_LABEL[item.ai_importance] || item.ai_importance}</span>
        )}
        <span className="ml-auto flex items-center gap-1">
          {score !== null && (
            <span className={`score ${score >= 80 ? 'score-high' : ''}`}>
              AI 评分 {score}
              <span className="text-[10px] opacity-70">/100</span>
            </span>
          )}
          <StarButton item={item} />
        </span>
      </div>

      {/* 标题：有 id 走详情页，否则（实时搜索结果）直跳原文 */}
      {item.id ? (
        <Link
          to={detailUrl(item.id, from)}
          className="block text-[16px] font-semibold leading-snug text-ink-900
                     group-hover:text-teal-600 transition-colors"
        >
          {item.title}
        </Link>
      ) : (
        <a
          href={item.url || '#'}
          target={item.url ? '_blank' : undefined}
          rel="noreferrer noopener"
          className="block text-[16px] font-semibold leading-snug text-ink-900
                     group-hover:text-teal-600 transition-colors"
        >
          {item.title}
        </a>
      )}

      {/* AI 摘要 */}
      {summary && (
        <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-700 line-clamp-3">
          {summary}
        </p>
      )}

      {/* 同事件其他信源（对齐目标站「另有 N 家信源报道」） */}
      {item.dup_count > 0 && (
        <div className="relative mt-2 inline-block">
          <span className="text-[11.5px] text-ink-500 cursor-default">
            另有 {item.dup_count} 家信源报道
          </span>
          <div className="hidden group-hover:block absolute z-20 left-0 bottom-full mb-1.5 w-max max-w-[260px] card p-2.5 text-[12px] text-ink-700">
            <div className="mb-1 text-[11px] text-ink-500">同事件其他信源</div>
            {item.dup_sources.map((s) => (
              <div key={s} className="py-0.5">
                {SOURCE_LABELS[s] || s}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 推荐理由 */}
      {item.ai_reason && (
        <div className="mt-2 flex items-start gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-50 border border-amber-200/60">
          <span className="text-[10.5px] font-medium text-amber-700 shrink-0 mt-0.5">推荐理由</span>
          <span className="text-[12.5px] leading-relaxed text-amber-900">{item.ai_reason}</span>
        </div>
      )}

      {/* 关键词标签：点击到全部动态按关键词检索 */}
      {item.id && item.ai_keywords?.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {item.ai_keywords.slice(0, 4).map((k) => (
            <Link
              key={k}
              to={`/all?q=${encodeURIComponent(k)}`}
              className="chip-neutral hover:text-teal-600 transition-colors"
            >
              # {k}
            </Link>
          ))}
        </div>
      )}

      {/* 元信息 */}
      <div className="mt-2.5 flex items-center gap-3 text-[11.5px] text-ink-500">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {fmtTime(item.fetched_at)}
        </span>
        {item.author && <span className="truncate max-w-[180px]">@{item.author}</span>}
        {item.ai_category && <span className="chip-neutral">{categoryLabel(item.ai_category)}</span>}
        {item.url && (
          <a
            href={item.url}
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
}
