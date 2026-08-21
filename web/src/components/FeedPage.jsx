import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import TimelineCard from './TimelineCard.jsx';
import HotSidePanel from './HotSidePanel.jsx';
import ModelPreview from './ModelPreview.jsx';
import { groupByDay, SOURCE_LABELS } from '../utils.js';
import {
  Loader2, RefreshCw, SlidersHorizontal, ChevronDown, ChevronRight,
  Search as SearchIcon, X,
} from 'lucide-react';

const CATEGORY_TABS = [
  { key: '', label: '全部' },
  { key: 'ai-models', label: '模型' },
  { key: 'ai-products', label: '产品' },
  { key: 'industry', label: '行业' },
  { key: 'paper', label: '论文' },
  { key: 'tip', label: '教程' },
  { key: 'opinion', label: '观点' },
];

const TIMES = [
  { key: '1h', label: '1小时' },
  { key: '6h', label: '6小时' },
  { key: '24h', label: '24小时' },
  { key: '7d', label: '7天' },
  { key: 'all', label: '全部' },
];

const SORTS = [
  { key: 'fetched_desc', label: '最新发现' },
  { key: 'heat_desc', label: '热度综合' },
  { key: 'score_desc', label: 'AI 评分' },
  { key: 'importance_desc', label: '重要程度' },
];

const IMPORTANCE = [
  { key: 'urgent', label: '紧急' },
  { key: 'high', label: '重要' },
  { key: 'medium', label: '一般' },
  { key: 'low', label: '低优' },
];

/** 页头日期：2026年8月19日星期三（对齐目标站） */
function fullToday() {
  const d = new Date();
  const WEEK = ['日', '一', '二', '三', '四', '五', '六'];
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日星期${WEEK[d.getDay()]}`;
}

/** 按天折叠分组：默认展开，点击标题栏收起 */
function DaySection({ group, featured = false }) {
  const [open, setOpen] = useState(true);
  return (
    <section>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center gap-2.5 mb-3 text-left cursor-pointer group"
      >
        <span className="day-bar inline-block group-hover:bg-paper-2 transition-colors">
          {group.label}
        </span>
        {group.sub && (
          <span className="text-[13px] text-ink-700">{group.sub}</span>
        )}
        <span className="text-[13px] text-ink-500">
          {group.weekday} · {group.items.length} 条
        </span>
        {open ? (
          <ChevronDown className="w-4 h-4 text-ink-500" />
        ) : (
          <ChevronRight className="w-4 h-4 text-ink-500" />
        )}
      </button>
      {open && (
        <div className="space-y-2.5 animate-fade-in">
          {group.items.map((it) => (
            <TimelineCard key={it.id} item={it} featured={featured} />
          ))}
        </div>
      )}
    </section>
  );
}

/**
 * FeedPage 信息流列表页（/ 精选 与 /all 全部动态 复用）
 * 筛选状态全部走 URL 参数（category / q / time_range / sort / sources / importance），可分享、可回退
 */
export default function FeedPage({ mode = 'featured' }) {
  const featured = mode === 'featured';
  const [params, setParams] = useSearchParams();

  // URL → 筛选状态（带各自默认值）
  const category = params.get('category') || '';
  const q = params.get('q') || '';
  const timeRange = params.get('time_range') || (featured ? '24h' : 'all');
  const sort = params.get('sort') || (featured ? 'score_desc' : 'fetched_desc');
  const sources = (params.get('sources') || '').split(',').filter(Boolean);
  const importance = (params.get('importance') || '').split(',').filter(Boolean);

  const [searchText, setSearchText] = useState(q);
  useEffect(() => setSearchText(q), [q]);

  const [showMore, setShowMore] = useState(false);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const pageRef = useRef(page);
  pageRef.current = page;

  const sourcesStr = sources.join(',');
  const importanceStr = importance.join(',');

  const loadPage = async (p, append) => {
    append ? setLoadingMore(true) : setLoading(true);
    try {
      const r = await api.listItems({
        category,
        keyword: q,
        time_range: timeRange,
        sort,
        sources: sourcesStr,
        importance: importanceStr,
        page: p,
        pageSize: 20,
      });
      const list = r.data || [];
      setItems((prev) => (append ? [...prev, ...list] : list));
      setTotal(r.meta?.total || 0);
      setPage(p);
    } catch {
      if (!append) { setItems([]); setTotal(0); }
    } finally {
      append ? setLoadingMore(false) : setLoading(false);
    }
  };

  // 筛选变化（以 URL 参数为准）→ 回到第一页重新加载
  useEffect(() => {
    loadPage(1, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, q, timeRange, sort, sourcesStr, importanceStr]);

  // 30s 静默刷新（仅在第一页时，避免打断已加载的更多内容）
  useEffect(() => {
    const t = setInterval(() => {
      if (pageRef.current !== 1) return;
      setRefreshing(true);
      loadPage(1, false).finally(() => setTimeout(() => setRefreshing(false), 600));
    }, 30000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, q, timeRange, sort, sourcesStr, importanceStr]);

  const dayGroups = useMemo(() => groupByDay(items), [items]);

  /** 修改 URL 参数（空值删除） */
  const patch = (patchObj) => {
    const next = new URLSearchParams(params);
    Object.entries(patchObj).forEach(([k, v]) => {
      const val = Array.isArray(v) ? v.join(',') : v;
      if (!val) next.delete(k);
      else next.set(k, val);
    });
    setParams(next);
  };

  const toggleArr = (arr, v) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const submitSearch = (e) => {
    e?.preventDefault();
    patch({ q: searchText.trim() });
  };

  const triggerCrawl = async () => {
    setRefreshing(true);
    try { await api.triggerCrawl(); } catch {}
    setTimeout(() => setRefreshing(false), 800);
  };

  const title = featured ? '精选' : '全部 AI 动态';
  const subtitle = featured
    ? `${fullToday()} · AI 筛选的今日重点`
    : `${fullToday()} · AI 相关资讯全量信息流`;

  return (
    <div className="max-w-[1040px] mx-auto px-4 sm:px-6 pt-6">
      {/* 页头 */}
      <div className="flex items-end justify-between mb-4">
        <div>
          <h1 className="text-[26px] font-bold tracking-tight leading-none">{title}</h1>
          <div className="mt-1.5 text-[13px] text-ink-500">{subtitle}</div>
        </div>
        <button
          onClick={triggerCrawl}
          className="btn text-[12px] text-ink-700"
          title="手动触发一次多源抓取"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          手动抓取
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_296px] gap-5 items-start">
        {/* 主栏 */}
        <div className="min-w-0">
          {/* 分类标签 */}
          <div className="flex items-center gap-1 flex-wrap mb-3">
            {CATEGORY_TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => patch({ category: t.key })}
                className={`cat-tab ${category === t.key ? 'cat-tab-active' : ''}`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* 站内搜索框（检索已入库数据：标题 / 摘要 / 正文 / 关键词） */}
          <form onSubmit={submitSearch} className="flex gap-2 mb-3">
            <div className="input flex items-center gap-2">
              <SearchIcon className="w-3.5 h-3.5 text-ink-300 shrink-0" />
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    submitSearch();
                  }
                }}
                placeholder="搜索标题、摘要…"
                aria-label="搜索标题、摘要"
                className="flex-1 bg-transparent outline-none text-sm min-w-0"
              />
              {searchText && (
                <button
                  type="button"
                  onClick={() => { setSearchText(''); patch({ q: '' }); }}
                  className="text-ink-300 hover:text-ink-700 shrink-0"
                  aria-label="清空搜索"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <button type="submit" className="btn text-[13px] shrink-0" disabled={!searchText.trim()}>
              搜索
            </button>
          </form>

          {/* 筛选工具条 */}
          <div className="card px-3.5 py-2.5 mb-4 text-[12px]">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="flex items-center gap-1.5 text-ink-500">
                <SlidersHorizontal className="w-3 h-3" />
                筛选
              </span>
              <div className="flex items-center gap-1">
                {TIMES.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => patch({ time_range: t.key })}
                    className={`seg ${timeRange === t.key ? 'seg-active' : ''}`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1">
                {SORTS.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => patch({ sort: t.key })}
                    className={`seg ${sort === t.key ? 'seg-active' : ''}`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowMore((v) => !v)}
                className="ml-auto inline-flex items-center gap-1 text-ink-500 hover:text-ink-900"
              >
                更多
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showMore ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {showMore && (
              <div className="mt-2.5 pt-2.5 border-t border-paper-2 space-y-2 animate-fade-in">
                <div className="flex items-center gap-1 flex-wrap">
                  <span className="text-ink-500 mr-1">重要度</span>
                  {IMPORTANCE.map((t) => (
                    <button
                      key={t.key}
                      onClick={() => patch({ importance: toggleArr(importance, t.key) })}
                      className={`seg ${importance.includes(t.key) ? 'seg-active' : ''}`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-1 flex-wrap">
                  <span className="text-ink-500 mr-1">来源</span>
                  {Object.entries(SOURCE_LABELS).map(([k, label]) => (
                    <button
                      key={k}
                      onClick={() => patch({ sources: toggleArr(sources, k) })}
                      className={`seg ${sources.includes(k) ? 'seg-active' : ''}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 时间线 */}
          {loading ? (
            <div className="py-20 grid place-items-center text-ink-500">
              <Loader2 className="w-5 h-5 animate-spin mb-2" />
              <span className="text-[13px]">加载中…</span>
            </div>
          ) : items.length === 0 ? (
            <div className="card p-12 text-center text-ink-500">
              <div className="text-[14px] font-medium text-ink-900 mb-1">
                {q ? `没有找到与「${q}」相关的内容` : '暂无匹配数据'}
              </div>
              <div className="text-[12.5px]">
                {q ? '换个关键词，或到「跨源搜索」实时抓取各平台' : '试试放宽时间范围或筛选条件，或点击右上角「手动抓取」'}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {dayGroups.map((g) => (
                <DaySection key={g.key} group={g} featured={featured} />
              ))}

              {/* 加载更多 */}
              {items.length < total && (
                <div className="pt-2 text-center">
                  <button
                    className="btn text-[13px]"
                    onClick={() => loadPage(page + 1, true)}
                    disabled={loadingMore}
                  >
                    {loadingMore ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : null}
                    加载更多（{items.length}/{total}）
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 右栏：今日热点 + 模型榜预览（仅精选页） */}
        {featured && (
          <aside className="hidden xl:block sticky top-6 space-y-4">
            <HotSidePanel />
            <ModelPreview />
          </aside>
        )}
      </div>
    </div>
  );
}
