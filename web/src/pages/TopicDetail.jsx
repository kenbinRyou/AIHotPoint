import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api.js';
import TimelineCard from '../components/TimelineCard.jsx';
import { groupByDay } from '../utils.js';
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * 主题详情（对齐目标站 /topics/:key）：该主题关键词命中的 AI 条目流
 */
export default function TopicDetail() {
  const { key } = useParams();
  const [topic, setTopic] = useState(null);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');

  const pageSize = 20;

  const loadPage = async (p, append) => {
    append ? setLoadingMore(true) : setLoading(true);
    try {
      const r = await api.getTopicItems(key, { page: p, pageSize });
      setTopic(r.meta?.topic || null);
      setTotal(r.meta?.total || 0);
      setItems((prev) => (append ? [...prev, ...(r.data || [])] : r.data || []));
      setPage(p);
      setError('');
    } catch (e) {
      if (!append) setError(e.message || '加载失败');
    } finally {
      append ? setLoadingMore(false) : setLoading(false);
    }
  };

  useEffect(() => {
    loadPage(1, false);
    window.scrollTo(0, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const dayGroups = groupByDay(items);

  return (
    <div className="max-w-[720px] mx-auto px-4 sm:px-6 pt-6">
      <Link
        to="/topics"
        className="inline-flex items-center gap-1 text-[12.5px] text-ink-500 hover:text-teal-600 mb-4"
      >
        <ChevronLeft className="w-3.5 h-3.5" />
        返回主题地图
      </Link>

      {loading ? (
        <div className="py-20 grid place-items-center text-ink-500">
          <Loader2 className="w-5 h-5 animate-spin mb-2" />
          <span className="text-[13px]">加载中…</span>
        </div>
      ) : error ? (
        <div className="card p-12 text-center text-ink-500">
          <div className="text-[14px] font-medium text-ink-900 mb-1">主题不存在</div>
          <div className="text-[12.5px]">{error}</div>
        </div>
      ) : (
        <>
          <div className="mb-5">
            <h1 className="text-[24px] font-bold tracking-tight leading-none">
              {topic?.name || key}
            </h1>
            <p className="mt-2 text-[13px] text-ink-500">
              {topic?.desc || ''} <span className="num ml-1">共 {total} 条</span>
            </p>
          </div>

          {items.length === 0 ? (
            <div className="card p-12 text-center text-ink-500">
              <div className="text-[14px] font-medium text-ink-900 mb-1">该主题暂无内容</div>
              <div className="text-[12.5px]">等内容积累后再来看看</div>
            </div>
          ) : (
            <div className="space-y-4">
              {dayGroups.map((g) => (
                <section key={g.key}>
                  <h2 className="day-bar inline-block mb-3">
                    {g.label}
                    {g.sub && <span className="ml-2 text-[13px] font-normal text-ink-700">{g.sub}</span>}
                  </h2>
                  <div className="space-y-2.5">
                    {g.items.map((it) => (
                      <TimelineCard key={it.id} item={it} />
                    ))}
                  </div>
                </section>
              ))}

              {items.length < total && (
                <div className="pt-2 text-center">
                  <button
                    className="btn text-[13px]"
                    onClick={() => loadPage(page + 1, true)}
                    disabled={loadingMore}
                  >
                    {loadingMore ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    加载更多（{items.length}/{total}）
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
