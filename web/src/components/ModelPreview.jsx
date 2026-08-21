import { Link } from 'react-router-dom';
import { Trophy, ChevronRight } from 'lucide-react';
import { MODELS, RANK_COLOR } from '../data/models.js';

/** 首页右栏「模型榜」预览（对齐目标站首页模型榜预览模块） */
export default function ModelPreview() {
  const top = MODELS.slice(0, 5);
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[15px] font-bold text-ink-900 flex items-center gap-1.5">
          <Trophy className="w-4 h-4 text-[#d3b26a]" />
          模型榜
        </h3>
        <Link
          to="/leaderboard"
          className="text-[12px] text-teal-600 hover:text-teal-700 inline-flex items-center gap-0.5"
        >
          完整榜单
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
      <ol className="space-y-0.5">
        {top.map((m) => (
          <li key={m.rank}>
            <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-paper-1 transition-colors">
              <span
                className="num text-[13px] font-semibold w-4 shrink-0 text-center"
                style={{ color: RANK_COLOR[m.rank - 1] || '#7b869a' }}
              >
                {m.rank}
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] leading-snug text-ink-900">{m.name}</div>
                <div className="text-[11px] text-ink-500">{m.vendor} · {m.tag}</div>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
