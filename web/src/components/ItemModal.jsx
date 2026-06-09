// 详情弹窗
import { X, ExternalLink, Sparkles, Clock, Hash, BarChart3 } from 'lucide-react';
import { fmtTime, fmtNum, SOURCE_LABELS, IMPORTANCE_LABEL } from '../utils.js';

export default function ItemModal({ item, onClose }) {
  if (!item) return null;
  const m = item.metrics || {};
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-6 bg-ink-950/80 backdrop-blur-sm"
         onClick={onClose}>
      <div className="card-glow max-w-2xl w-full p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-4">
          <span className="chip-urgent">详情</span>
          <button className="text-slate-500 hover:text-slate-200" onClick={onClose}>
            <X className="w-4 h-4" />
          </button>
        </div>
        <h2 className="text-2xl font-display font-bold text-slate-100 leading-tight mb-3">
          {item.title}
        </h2>
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="chip">{SOURCE_LABELS[item.source] || item.source}</span>
          {item.ai_importance && <span className="chip">{IMPORTANCE_LABEL[item.ai_importance]}</span>}
          {item.ai_category && <span className="chip border-plasma-400/30 bg-plasma-500/10 text-plasma-400">{item.ai_category}</span>}
          {typeof item.ai_score === 'number' && <span className="chip num">AI score {item.ai_score.toFixed(2)}</span>}
        </div>

        {item.ai_summary && (
          <div className="mb-4 p-3 rounded-md bg-ink-900/60 border border-plasma-400/20">
            <div className="text-[11px] font-mono uppercase tracking-widest text-plasma-400 flex items-center gap-1 mb-1">
              <Sparkles className="w-3 h-3" /> AI 摘要
            </div>
            <p className="text-sm text-slate-200 leading-relaxed">{item.ai_summary}</p>
          </div>
        )}

        {item.content && item.content !== item.ai_summary && (
          <p className="text-sm text-slate-400 leading-relaxed mb-4">{item.content}</p>
        )}

        {item.ai_keywords?.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-1.5">
            {item.ai_keywords.map((k) => (
              <span key={k} className="chip text-cyan-300">#{k}</span>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono text-slate-400 mb-4">
          {item.author && <div className="flex items-center gap-1"><Hash className="w-3 h-3" />{item.author}</div>}
          <div className="flex items-center gap-1"><Clock className="w-3 h-3" />发布 {fmtTime(item.published_at)}</div>
          <div className="flex items-center gap-1"><Clock className="w-3 h-3" />发现 {fmtTime(item.fetched_at)}</div>
          {(m.views || m.likes || m.shares) ? (
            <div className="flex items-center gap-1">
              <BarChart3 className="w-3 h-3" />
              V {fmtNum(m.views)} · L {fmtNum(m.likes)} · S {fmtNum(m.shares)}
            </div>
          ) : <div />}
        </div>

        {item.url && (
          <a href={item.url} target="_blank" rel="noreferrer noopener"
             className="btn-primary w-full justify-center">
            <ExternalLink className="w-4 h-4" /> 打开原文
          </a>
        )}
      </div>
    </div>
  );
}
