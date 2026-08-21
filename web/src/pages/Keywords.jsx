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
    <div className="max-w-[720px] mx-auto px-4 sm:px-6 pt-6 space-y-5">
      {/* 页头 */}
      <div className="mb-1">
        <h1 className="text-[26px] font-bold tracking-tight leading-none flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-lg bg-teal-600 grid place-items-center">
            <Tag className="w-4 h-4 text-white" />
          </span>
          关键词监控
        </h1>
        <p className="mt-2 text-[13px] text-ink-500">
          关键词用于过滤抓取结果、预填搜索，命中后高亮展示
        </p>
      </div>

      {/* 添加卡片 */}
      <div className="card p-5">
        <div className="flex gap-2">
          <input
            value={kw}
            onChange={(e) => setKw(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && add()}
            placeholder="输入关键词后回车，如：OpenAI / 机器人"
            className="input"
          />
          <button onClick={add} className="btn-primary shrink-0" disabled={loading || !kw.trim()}>
            <Plus className="w-4 h-4" />
            添加
          </button>
        </div>
      </div>

      {/* 列表 */}
      <div className="card overflow-hidden">
        {list.length === 0 && (
          <div className="p-10 text-center text-[13px] text-ink-500">
            还没有关键词，添加一个开始监控
          </div>
        )}
        <ul className="divide-y divide-paper-2">
          {list.map((k) => (
            <li key={k.id} className="flex items-center gap-3 px-4 py-3 hover:bg-paper-1/60 transition-colors">
              {k.enabled
                ? <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                : <Circle className="w-4 h-4 text-ink-300 shrink-0" />}
              <span className="flex-1 text-[13.5px] text-ink-900 truncate">#{k.keyword}</span>
              <span className="text-[11.5px] text-ink-500 num shrink-0">{fmtTime(k.created_at)}</span>
              <button
                onClick={() => del(k.id)}
                className="text-ink-300 hover:text-red-500 transition-colors shrink-0"
                title="删除"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
