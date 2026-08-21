import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import TimelineCard from '../components/TimelineCard.jsx';
import { Search as SearchIcon, Loader2, Sparkles } from 'lucide-react';
import { SOURCE_LABELS } from '../utils.js';

const ALL_SOURCES = Object.keys(SOURCE_LABELS);

export default function SearchPage() {
  const [params] = useSearchParams();
  const [keyword, setKeyword] = useState(params.get('q') || '');
  const [sources, setSources] = useState([]); // 空数组 = 全部
  const [analyze, setAnalyze] = useState(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const toggle = (k) => setSources((s) => (s.includes(k) ? s.filter((x) => x !== k) : [...s, k]));

  const submit = async (e) => {
    e?.preventDefault();
    if (!keyword.trim()) return;
    setLoading(true);
    try {
      const r = await api.search({ keyword, sources, analyze });
      setResult(r.data);
    } catch (err) {
      setResult({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  // 自动执行：如果带 ?q= 直接搜一次
  useEffect(() => {
    if (params.get('q') && keyword) submit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="max-w-[720px] mx-auto px-4 sm:px-6 pt-6 space-y-5">
      {/* 页头 */}
      <div className="mb-1">
        <h1 className="text-[26px] font-bold tracking-tight leading-none flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-lg bg-teal-600 grid place-items-center">
            <SearchIcon className="w-4 h-4 text-white" />
          </span>
          跨源搜索
        </h1>
        <p className="mt-2 text-[13px] text-ink-500">
          实时抓取 8 个数据源（结果不入库），可选 AI 摘要与评级
        </p>
      </div>

      {/* 搜索卡片 */}
      <div className="card p-5">
        <form onSubmit={submit} className="space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="输入关键词，如：OpenAI / 大模型 / 芯片…"
              className="input"
            />
            <button type="submit" className="btn-primary shrink-0" disabled={loading || !keyword.trim()}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <SearchIcon className="w-4 h-4" />}
              搜索
            </button>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11.5px] text-ink-500 mr-1">数据源</span>
            <button
              type="button"
              onClick={() => setSources([])}
              className={`px-2.5 py-1 rounded-md text-[12px] transition-colors ${
                sources.length === 0
                  ? 'bg-teal-600 text-white'
                  : 'text-ink-700 hover:bg-paper-1'
              }`}
            >
              全部
            </button>
            {ALL_SOURCES.map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => toggle(k)}
                className={`px-2.5 py-1 rounded-md text-[12px] transition-colors ${
                  sources.includes(k) ? 'bg-teal-600 text-white' : 'text-ink-700 hover:bg-paper-1'
                }`}
              >
                {SOURCE_LABELS[k]}
              </button>
            ))}
          </div>

          <label className="inline-flex items-center gap-2 text-[12.5px] text-ink-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={analyze}
              onChange={(e) => setAnalyze(e.target.checked)}
              className="accent-teal-600 w-3.5 h-3.5"
            />
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            对结果做 AI 摘要与评级（慢一点，但更易读）
          </label>
        </form>
      </div>

      {/* 错误 */}
      {result?.error && (
        <div className="card p-4 text-red-600 text-[13px]">{result.error}</div>
      )}

      {/* 结果 */}
      {result && !result.error && (
        <>
          <div className="text-[12px] text-ink-500 num">
            关键词「{result.keyword}」 · 共 {result.total} 条 · 抓取于 {new Date(result.fetchedAt).toLocaleString()}
          </div>

          {result.perSource?.length > 0 && (
            <div className="card px-3.5 py-2.5 flex flex-wrap gap-2 text-[11.5px]">
              {result.perSource.map((p) => (
                <span key={p.source} className="chip-neutral">
                  {SOURCE_LABELS[p.source] || p.source}: {p.items?.length || 0}
                </span>
              ))}
            </div>
          )}

          <div className="space-y-2.5">
            {(result.items || []).map((it, idx) => (
              <div key={it.url + idx} className="space-y-1.5">
                <TimelineCard item={{ ...it, fetched_at: result.fetchedAt }} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
