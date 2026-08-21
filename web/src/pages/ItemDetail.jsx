import { useEffect, useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { api } from '../api.js';
import {
  fmtTime, fmtScore, fmtNum, SOURCE_LABELS, IMPORTANCE_LABEL, IMPORTANCE_CHIP,
} from '../utils.js';
import StarButton from '../components/StarButton.jsx';
import { Loader2, ExternalLink, ChevronLeft, Sparkles, Hash, Clock, BarChart3 } from 'lucide-react';

/**
 * 内容详情页（对齐目标站 /items/:id：标签 / AI 导读 / 正文 / 打开原文）
 * 支持 ?from= 返回来源列表
 */
export default function ItemDetail() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const from = params.get('from');
  const backTo = from && from.startsWith('/') ? from : '/';
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError('');
    api.getItem(id)
      .then((r) => { if (alive) setItem(r.data || null); })
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

  if (error || !item) {
    return (
      <div className="max-w-[720px] mx-auto px-4 sm:px-6 py-24 text-center">
        <div className="text-[15px] font-medium text-ink-900 mb-1.5">内容不存在或已删除</div>
        <div className="text-[12.5px] text-ink-500 mb-5">{error}</div>
        <Link to="/" className="btn-primary text-[13px]">返回首页</Link>
      </div>
    );
  }

  const score = fmtScore(item.ai_score);
  const m = item.metrics || {};

  return (
    <div className="max-w-[720px] mx-auto px-4 sm:px-6 pt-6 pb-4">
      {/* 返回来源列表 */}
      <Link
        to={backTo}
        className="inline-flex items-center gap-1 text-[12.5px] text-ink-500 hover:text-teal-600 mb-5"
      >
        <ChevronLeft className="w-3.5 h-3.5" />
        返回{
          from?.startsWith('/all') ? '全部 AI 动态'
          : from?.startsWith('/story/') ? '事件'
          : from === '/hot' ? '热点榜'
          : from === '/starred' ? '收藏'
          : from?.startsWith('/topics') ? '主题'
          : '精选'
        }
      </Link>

      {/* 标签：点击到全部动态按关键词检索 */}
      {item.ai_keywords?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {item.ai_keywords.slice(0, 8).map((k) => (
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

      {/* 信源行 + 收藏 */}
      <div className="flex items-center gap-2 flex-wrap mb-3 text-[12.5px] text-ink-500">
        <span className="text-ink-700">{SOURCE_LABELS[item.source] || item.source}</span>
        {item.ai_importance && (
          <span className={IMPORTANCE_CHIP[item.ai_importance] || 'chip-neutral'}>
            {IMPORTANCE_LABEL[item.ai_importance]}
          </span>
        )}
        {score !== null && (
          <span className={`score ${score >= 80 ? 'score-high' : ''}`}>
            AI 编辑部评分 {score}
            <span className="text-[10px] opacity-70">/100</span>
          </span>
        )}
        <span className="ml-auto">
          <StarButton item={item} size={17} />
        </span>
      </div>

      {/* 标题 */}
      <h1 className="text-[24px] sm:text-[27px] font-bold leading-snug tracking-tight text-ink-900">
        {item.title}
      </h1>
      <div className="mt-2.5 text-[12px] text-ink-500 num">
        发布 {fmtTime(item.published_at)} · 发现 {fmtTime(item.fetched_at)}
      </div>

      {/* AI 导读 */}
      {item.ai_summary && (
        <div className="mt-5 card p-4 bg-teal-100">
          <div className="text-[11px] font-semibold text-teal-600 flex items-center gap-1.5 mb-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            AI 导读
          </div>
          <p className="text-[13.5px] leading-relaxed text-ink-900">{item.ai_summary}</p>
        </div>
      )}

      {/* 推荐理由 */}
      {item.ai_reason && (
        <div className="mt-3 card p-4 bg-amber-50 border border-amber-200/60">
          <div className="text-[11px] font-semibold text-amber-700 flex items-center gap-1.5 mb-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            推荐理由
          </div>
          <p className="text-[13.5px] leading-relaxed text-amber-900">{item.ai_reason}</p>
        </div>
      )}

      {/* AI 全文翻译（三段式：AI 导读 → 推荐理由 → 全文） */}
      {item.full_text_zh && (
        <div className="mt-3 card p-4">
          <div className="text-[11px] font-semibold text-teal-600 flex items-center gap-1.5 mb-2">
            <Languages className="w-3.5 h-3.5" />
            AI 全文翻译
          </div>
          <p className="text-[14px] leading-[1.85] text-ink-900 whitespace-pre-wrap">
            {item.full_text_zh}
          </p>
        </div>
      )}

      {/* 正文 */}
      {item.content && item.content !== item.ai_summary && (
        <div className="mt-5">
          <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-ink-500 mb-2">
            正文摘要
          </div>
          <p className="text-[14.5px] leading-[1.85] text-ink-900 whitespace-pre-wrap">
            {item.content}
          </p>
        </div>
      )}

      {/* 元信息 */}
      <div className="mt-6 card px-4 py-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11.5px] text-ink-500">
        {item.author && (
          <div className="flex items-center gap-1.5">
            <Hash className="w-3 h-3" />
            <span className="truncate">{item.author}</span>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <Clock className="w-3 h-3" />
          {fmtTime(item.published_at || item.fetched_at)}
        </div>
        {(m.likes || m.shares || m.views) && (
          <div className="flex items-center gap-1.5 num">
            <BarChart3 className="w-3 h-3" />
            赞 {fmtNum(m.likes)} · 转 {fmtNum(m.shares)} · 看 {fmtNum(m.views)}
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-teal-600" />
          {SOURCE_LABELS[item.source] || item.source}
        </div>
      </div>

      {/* 打开原文 */}
      {item.url && (
        <a
          href={item.url}
          target="_blank"
          rel="noreferrer noopener"
          className="btn-primary w-full justify-center mt-4 text-[13.5px]"
        >
          <ExternalLink className="w-4 h-4" />
          打开原文
        </a>
      )}
    </div>
  );
}
