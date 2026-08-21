import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { api } from '../api.js';
import TimelineCard from '../components/TimelineCard.jsx';
import { Loader2, Newspaper } from 'lucide-react';

function shiftDate(d, delta) {
  const [y, m, day] = d.split('-').map(Number);
  const dt = new Date(y, m - 1, day + delta);
  const p = (n) => String(n).padStart(2, '0');
  return `${dt.getFullYear()}-${p(dt.getMonth() + 1)}-${p(dt.getDate())}`;
}
function monthKey(d) {
  const [y, m] = d.split('-');
  return `${y}-${m}`;
}

const STAT_META = [
  { key: 'events', label: '今日事件' },
  { key: 'firstHand', label: '一手报道' },
  { key: 'newModels', label: '新模型' },
  { key: 'sources', label: '信源数' },
];

function TabLink({ to, label, match }) {
  const { pathname } = useLocation();
  const active = match ? pathname.startsWith(match) : pathname === to;
  return (
    <Link
      to={to}
      className={`px-3 py-1.5 rounded-full text-[13px] whitespace-nowrap transition-colors cursor-pointer ${
        active ? 'bg-teal-600 text-white font-medium' : 'text-ink-700 hover:text-ink-900 hover:bg-paper-1'
      }`}
    >
      {label}
    </Link>
  );
}

/**
 * AI 日报（对齐目标站 /daily）：VOL 期号 + 四指标统计栏 + 五栏目分节 + 按月归档 + 前后天导航
 */
export default function Daily() {
  const { date: routeDate } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [empty, setEmpty] = useState(false);
  const [archive, setArchive] = useState([]);

  useEffect(() => {
    api.listDaily().then((r) => setArchive(r.data || [])).catch(() => {});
  }, [routeDate]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setEmpty(false);
    setReport(null);
    const req = routeDate ? api.getDaily(routeDate) : api.getDailyLatest();
    req
      .then((r) => {
        if (!alive) return;
        if (r.data) setReport(r.data);
        else setEmpty(true);
      })
      .catch(() => { if (alive) setEmpty(true); })
      .finally(() => { if (alive) setLoading(false); });
    window.scrollTo(0, 0);
    return () => { alive = false; };
  }, [routeDate]);

  const today = new Date();
  const p = (n) => String(n).padStart(2, '0');
  const todayKey = `${today.getFullYear()}-${p(today.getMonth() + 1)}-${p(today.getDate())}`;
  const activeDate = report?.date || routeDate || todayKey;

  // 按月分组归档
  const groupedArchive = [];
  const byMonth = {};
  archive.forEach((a) => {
    const mk = monthKey(a.date);
    (byMonth[mk] ||= []).push(a);
  });
  Object.keys(byMonth)
    .sort()
    .reverse()
    .forEach((mk) => groupedArchive.push({ month: mk, items: byMonth[mk] }));

  return (
    <div className="max-w-[720px] mx-auto px-4 sm:px-6 pt-6 pb-10">
      {/* 三 tab：日报 / 周报 / 月报 */}
      <div className="flex items-center gap-1 mb-5">
        <TabLink to="/daily" match="/daily" label="日报" />
        <TabLink to="/weekly" match="/weekly" label="周报" />
        <TabLink to="/monthly" match="/monthly" label="月报" />
      </div>

      {/* 页头 */}
      <div className="mb-5">
        <h1 className="text-[26px] font-bold tracking-tight flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-lg bg-teal-600 grid place-items-center">
            <Newspaper className="w-4 h-4 text-white" />
          </span>
          AI 日报
        </h1>
        <p className="mt-2 text-[13px] text-ink-500">
          每天 AI 从全部信源挑选的重点，一篇看懂今日 AI 领域。
        </p>
      </div>

      {loading ? (
        <div className="card rounded-panel py-24 grid place-items-center text-ink-500">
          <Loader2 className="w-5 h-5 animate-spin mb-2" />
          <span className="text-[13px]">正在汇总今日重点…</span>
        </div>
      ) : empty || !report ? (
        <div className="card rounded-panel p-12 text-center text-ink-500">
          <div className="text-[14px] font-medium text-ink-900 mb-1">
            {routeDate ? '这一天没有生成日报' : '今日暂无 AI 相关内容'}
          </div>
          <div className="text-[12.5px]">
            {routeDate ? '换一天看看，或从归档里选择' : '内容抓取后再来看看'}
          </div>
        </div>
      ) : (
        <>
          {/* VOL 标题 + 阅读时长 */}
          <div className="mb-4">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="num text-[20px] font-bold text-teal-600">{report.vol}</span>
              <span className="text-[15px] font-semibold text-ink-900">· {report.storyCount} STORIES</span>
            </div>
            <div className="mt-1 text-[12.5px] text-ink-500">
              {report.storyCount} 篇报道 · 约 {report.readMinutes} 分钟阅读
            </div>
            {report.intro && (
              <p className="mt-3 text-[14px] leading-relaxed text-ink-700">{report.intro}</p>
            )}
          </div>

          {/* 四指标统计栏 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-6">
            {STAT_META.map((s) => (
              <div key={s.key} className="card p-3">
                <div className="num text-[22px] font-bold text-ink-900">
                  {report.stats?.[s.key] ?? '—'}
                </div>
                <div className="text-[12px] text-ink-500 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>

          {/* 五栏目分节 */}
          <div className="space-y-6">
            {report.sections.map((sec) => (
              <section key={sec.key}>
                <div className="flex items-center gap-2 mb-2.5">
                  <h2 className="text-[15px] font-semibold text-ink-900">{sec.label}</h2>
                  <span className="chip-neutral">{sec.count}</span>
                </div>
                <div className="space-y-2.5">
                  {sec.items.map((it) => (
                    <TimelineCard key={it.id} item={it} />
                  ))}
                </div>
              </section>
            ))}
            {report.sections.length === 0 && (
              <div className="card p-8 text-center text-ink-500">当日暂无分组内容</div>
            )}
          </div>
        </>
      )}

      {/* 按月归档 */}
      <div className="mt-8 card p-4">
        <div className="side-group mb-2 px-1">日报归档</div>
        <div className="max-h-[360px] overflow-y-auto space-y-3">
          {groupedArchive.map((g) => (
            <div key={g.month}>
              <div className="text-[12px] font-medium text-ink-500 px-1 mb-1">
                {g.month.replace('-', ' 年 ')} 月
              </div>
              <ul>
                {g.items.map((a) => {
                  const active = activeDate === a.date;
                  return (
                    <li key={a.date}>
                      <Link
                        to={`/daily/${a.date}`}
                        className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-[12.5px] transition-colors ${
                          active
                            ? 'bg-teal-100 text-teal-600 font-medium'
                            : 'text-ink-700 hover:bg-paper-1'
                        }`}
                      >
                        <span className="num">{a.date.slice(5)}</span>
                        <span className="truncate text-ink-500">{a.title}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
          {groupedArchive.length === 0 && (
            <div className="px-2 py-1.5 text-[12px] text-ink-500">暂无归档</div>
          )}
        </div>
      </div>

      {/* 前后天导航 + 页脚 */}
      <div className="mt-6 flex items-center justify-between">
        <button onClick={() => navigate(`/daily/${shiftDate(activeDate, -1)}`)} className="btn text-[13px]">
          ← 前一天
        </button>
        <button onClick={() => navigate(`/daily/${shiftDate(activeDate, 1)}`)} className="btn text-[13px]">
          后一天 →
        </button>
      </div>
      <div className="mt-4 text-center text-[11px] text-ink-500">AIHOT DAILY · 每早八时更新</div>
    </div>
  );
}
