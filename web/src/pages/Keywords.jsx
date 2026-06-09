import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { Plus, Trash2, Tag, CheckCircle2, Circle } from 'lucide-react';
import { fmtTime } from '../utils.js';

export default function Keywords() {
  const [list, setList] = useState([]);
  const [kw, setKw] = useState('');
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const r = await api.listKeywords();
    setList(r.data || []);
  };
  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!kw.trim()) return;
    setLoading(true);
    try {
      await api.addKeyword(kw.trim());
      setKw('');
      await load();
    } finally {
      setLoading(false);
    }
  };

  const del = async (id) => {
    await api.delKeyword(id);
    await load();
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="card p-6">
        <h2 className="font-display text-2xl font-bold mb-1 flex items-center gap-2">
          <Tag className="w-5 h-5 text-plasma-400" /> 监控关键词
        </h2>
        <p className="text-sm text-slate-500 mb-5">关键词会用于：(1) 过滤主页抓取结果 (2) 搜索页预填 (3) 命中后会高亮</p>
        <div className="flex gap-2">
          <input value={kw} onChange={(e) => setKw(e.target.value)}
                 onKeyDown={(e) => e.key === 'Enter' && add()}
                 placeholder="输入关键词后回车"
                 className="flex-1 bg-ink-900/60 border border-white/10 rounded-md px-3 py-2 text-sm
                            placeholder:text-slate-600 focus:outline-none focus:border-plasma-400/40" />
          <button onClick={add} className="btn-primary" disabled={loading || !kw.trim()}>
            <Plus className="w-4 h-4" /> 添加
          </button>
        </div>
      </div>

      <div className="card divide-y divide-white/5">
        {list.length === 0 && (
          <div className="p-6 text-sm font-mono text-slate-500 text-center">还没有关键词，添加一个开始监控</div>
        )}
        {list.map((k) => (
          <div key={k.id} className="flex items-center gap-3 p-3 hover:bg-white/5 transition-colors">
            {k.enabled ? <CheckCircle2 className="w-4 h-4 text-cyan-400" /> : <Circle className="w-4 h-4 text-slate-600" />}
            <span className="flex-1 text-sm text-slate-200">#{k.keyword}</span>
            <span className="text-[11px] font-mono text-slate-500">{fmtTime(k.created_at)}</span>
            <button onClick={() => del(k.id)} className="text-slate-500 hover:text-red-400">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
