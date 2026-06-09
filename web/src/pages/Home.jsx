import { useEffect, useState } from 'react';
import { api } from '../api.js';
import HeatCard from '../components/HeatCard.jsx';
import FilterBar from '../components/FilterBar.jsx';
import HeatStream from '../components/HeatStream.jsx';
import SourceBeacons from '../components/SourceBeacons.jsx';
import ItemModal from '../components/ItemModal.jsx';
import { Loader2 } from 'lucide-react';

const DEFAULT_FILTER = {
  sources: [],
  importance: [],
  keyword: '',
  time_range: '24h',
  sort: 'fetched_desc',
  page: 1,
  pageSize: 18,
};

export default function Home() {
  const [filter, setFilter] = useState(DEFAULT_FILTER);
  const [data, setData] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState(null);

  useEffect(() => {
    let alive = true;
    const run = async () => {
      setLoading(true);
      try {
        const params = {
          ...filter,
          sources: filter.sources.join(','),
          importance: filter.importance.join(','),
        };
        const r = await api.listItems(params);
        if (alive) setData({ items: r.data || [], total: r.meta?.total || 0 });
      } catch (e) {
        if (alive) setData({ items: [], total: 0 });
      } finally {
        if (alive) setLoading(false);
      }
    };
    run();
    return () => { alive = false; };
  }, [filter]);

  // 30s 自动刷新
  useEffect(() => {
    const t = setInterval(() => setFilter((f) => ({ ...f, page: 1 })), 30000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
      <aside className="space-y-4">
        <SourceBeacons onTrigger={async () => { await api.triggerCrawl(); }} />
        <HeatStream />
        <FilterBar value={filter} onChange={(v) => setFilter({ ...DEFAULT_FILTER, ...v })} />
      </aside>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-2xl font-bold tracking-tight">
            实时热点流
            <span className="ml-3 text-sm font-mono text-slate-500 num">{data.total} 条</span>
          </h2>
          {loading && <Loader2 className="w-4 h-4 animate-spin text-slate-500" />}
        </div>

        {data.items.length === 0 && !loading && (
          <div className="card p-10 text-center text-slate-500 font-mono text-sm">
            <div className="mb-2 text-plasma-400">没有匹配的数据</div>
            <div>试试调整筛选条件，或点击右上角"手动抓取"</div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {data.items.map((it) => (
            <HeatCard key={it.id} item={it} onClick={setModal} />
          ))}
        </div>
      </section>

      {modal && <ItemModal item={modal} onClose={() => setModal(null)} />}
    </div>
  );
}
