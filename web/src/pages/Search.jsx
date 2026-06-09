import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import HeatCard from '../components/HeatCard.jsx';
import ItemModal from '../components/ItemModal.jsx';
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
  const [modal, setModal] = useState(null);

  const toggle = (k) => setSources((s) => (s.includes(k) ? s.filter((x) => x !== k) : [...s, k]));

  const submit = async (e) => {
    e?.preventDefault();
    if (!keyword.trim()) return;
    setLoading(true);
    try {
      const r = await api.search({ keyword, sources, analyze });
      setResult(r.data);
    } catch (e) {
      setResult({ error: e.message });
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
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="card p-6">
        <h2 className="font-display text-2xl font-bold mb-1 flex items-center gap-2">
          <SearchIcon className="w-5 h-5 text-plasma-400" />
          跨源搜索
        </h2>
        <p className="text-sm text-slate-500 mb-5">实时抓取（不入库到主页），可勾选源 + AI 摘要</p>

        <form onSubmit={submit} className="space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="输入关键词，如：OpenAI Sora / 苹果发布会 / 央行降息…"
              className="flex-1 bg-ink-900/60 border border-white/10 rounded-md px-3 py-2 text-sm
                         placeholder:text-slate-600 focus:outline-none focus:border-plasma-400/40"
            />
            <button type="submit" className="btn-primary" disabled={loading || !keyword.trim()}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <SearchIcon className="w-4 h-4" />}
              搜索
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-mono text-slate-500 mr-1">源</span>
            <button type="button" onClick={() => setSources([])}
                    className={`px-2.5 py-1 rounded-md text-xs font-mono border ${
                      sources.length === 0 ? 'border-plasma-400/50 bg-plasma-500/15 text-plasma-400' : 'border-white/10 text-slate-400'
                    }`}>
              全部
            </button>
            {ALL_SOURCES.map((k) => (
              <button key={k} type="button" onClick={() => toggle(k)}
                      className={`px-2.5 py-1 rounded-md text-xs font-mono border ${
                        sources.includes(k) ? 'border-cyan-400/50 bg-cyan-400/15 text-cyan-300' : 'border-white/10 text-slate-400'
                      }`}>
                {SOURCE_LABELS[k]}
              </button>
            ))}
          </div>

          <label className="inline-flex items-center gap-2 text-xs font-mono text-slate-400 cursor-pointer">
            <input type="checkbox" checked={analyze} onChange={(e) => setAnalyze(e.target.checked)}
                   className="accent-plasma-500" />
            <Sparkles className="w-3 h-3 text-plasma-400" />
            对结果做 AI 摘要（慢一点，但更易读）
          </label>
        </form>
      </div>

      {result?.error && (
        <div className="card p-4 border-red-500/30 text-red-300 text-sm font-mono">{result.error}</div>
      )}

      {result && !result.error && (
        <>
          <div className="text-xs font-mono text-slate-500">
            关键词「{result.keyword}」 · 共 {result.total} 条 · {new Date(result.fetchedAt).toLocaleString()}
          </div>

          {result.perSource?.length > 0 && (
            <div className="card p-3 flex flex-wrap gap-2 text-[11px] font-mono">
              {result.perSource.map((p) => (
                <span key={p.source} className="chip">
                  {SOURCE_LABELS[p.source] || p.source}: {p.items?.length || 0}
                </span>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {(result.items || []).map((it, idx) => (
              <div key={it.url + idx} className="space-y-2">
                <HeatCard item={{ ...it, id: idx, fetched_at: result.fetchedAt }} onClick={setModal} />
                {it.ai && (
                  <div className="card p-2 text-[11px] font-mono text-slate-500">
                    <span className="text-plasma-400">AI · {it.ai.importance}</span> · {it.ai.summary}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {modal && <ItemModal item={modal} onClose={() => setModal(null)} />}
    </div>
  );
}
