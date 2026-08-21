import { Trophy } from 'lucide-react';
import { MODELS, RANK_COLOR } from '../data/models.js';

export default function Leaderboard() {
  return (
    <div className="max-w-[720px] mx-auto px-4 sm:px-6 pt-6 pb-10">
      <div className="flex items-center gap-2">
        <Trophy className="w-6 h-6 text-[#d3b26a]" />
        <h1 className="text-[26px] font-bold tracking-tight">模型榜</h1>
      </div>
      <div className="mt-1.5 text-[13px] text-ink-500">
        AI 领域主流模型与产品的能力坐标（人工整理，持续更新）
      </div>

      <div className="mt-5 card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-ink-500 text-[12px] border-b border-paper-2">
              <th className="text-left font-medium px-4 py-2.5 w-10">#</th>
              <th className="text-left font-medium px-2 py-2.5">模型</th>
              <th className="text-left font-medium px-2 py-2.5">厂商</th>
              <th className="text-left font-medium px-2 py-2.5">发布</th>
              <th className="text-left font-medium px-4 py-2.5">定位</th>
            </tr>
          </thead>
          <tbody>
            {MODELS.map((m) => (
              <tr key={m.rank} className="border-b border-paper-2 last:border-0 hover:bg-paper-1 transition-colors">
                <td className="px-4 py-3">
                  <span
                    className="font-bold num"
                    style={{ color: RANK_COLOR[m.rank - 1] || '#7b869a' }}
                  >
                    {m.rank}
                  </span>
                </td>
                <td className="px-2 py-3 font-semibold text-ink-900">{m.name}</td>
                <td className="px-2 py-3 text-ink-700">{m.vendor}</td>
                <td className="px-2 py-3 text-ink-500 num whitespace-nowrap">{m.date}</td>
                <td className="px-4 py-3 text-ink-700 text-[13px]">{m.tag}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-[12px] text-ink-500">
        想让你的模型出现在这里？欢迎通过侧栏「反馈」告诉我们。
      </p>
    </div>
  );
}
