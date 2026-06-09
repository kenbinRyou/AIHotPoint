import { ExternalLink, Clock, Hash, BarChart3, Sparkles } from 'lucide-react';
import { fmtTime, fmtNum, SOURCE_LABELS, IMPORTANCE_CHIP, IMPORTANCE_LABEL } from '../utils.js';

/**
 * HeatCard 单条热点卡片
 * 视觉：
 *   - 左侧热力色条（重要性高 = 红色）
 *   - 顶部 chip：重要性 / 来源 / AI 评分
 *   - 标题（大字体）
 *   - AI 摘要（如果有）
 *   - 底部：作者 / 时间 / 互动数据
 */
export default function HeatCard({ item, onClick }) {
  const heatLevel = item.ai_importance || 'low';
  const heatBarClass = `heat-bar`; // 全程渐变
  const impChipClass = IMPORTANCE_CHIP[heatLevel] || 'chip-low';
  const m = item.metrics || {};
  const totalEngagement = (m.likes || 0) + (m.shares || 0) * 2 + (m.views || 0) * 0.01 + (item.ai_score || 0) * 1000;

  return (
    <article
      onClick={() => onClick?.(item)}
      className="card-glow p-5 group cursor-pointer animate-slide-in"
    >
      {/* 热力色条 */}
      <div className={`${heatBarClass} mb-4 opacity-90`} />

      <div className="flex items-center gap-2 flex-wrap mb-3">
        <span className={impChipClass}>
          <Sparkles className="w-3 h-3" />
          {IMPORTANCE_LABEL[heatLevel] || heatLevel}
        </span>
        <span className="chip">
          {SOURCE_LABELS[item.source] || item.source}
        </span>
        {item.ai_category && (
          <span className="chip border-plasma-400/30 bg-plasma-500/10 text-plasma-400">
            {item.ai_category}
          </span>
        )}
        {typeof item.ai_score === 'number' && (
          <span className="chip num">score {item.ai_score.toFixed(2)}</span>
        )}
      </div>

      <h3 className="text-lg font-display font-semibold text-slate-100 leading-snug group-hover:text-plasma-400 transition-colors line-clamp-2">
        {item.title}
      </h3>

      {(item.ai_summary || item.content) && (
        <p className="text-sm text-slate-400 mt-2 line-clamp-2">
          {item.ai_summary || item.content}
        </p>
      )}

      <div className="mt-4 flex items-center justify-between text-xs text-slate-500 font-mono">
        <div className="flex items-center gap-3">
          {item.author && (
            <span className="flex items-center gap-1">
              <Hash className="w-3 h-3" />
              {item.author}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {fmtTime(item.fetched_at)}
          </span>
        </div>
        <div className="flex items-center gap-3 num">
          {(m.likes || m.shares || m.views) ? (
            <span className="flex items-center gap-1 text-slate-400">
              <BarChart3 className="w-3 h-3" />
              {fmtNum(totalEngagement)}
            </span>
          ) : null}
          {item.url && (
            <a
              href={item.url}
              target="_blank"
              rel="noreferrer noopener"
              onClick={(e) => e.stopPropagation()}
              className="text-plasma-400 hover:text-cyan-300 inline-flex items-center gap-1"
            >
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
