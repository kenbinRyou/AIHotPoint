import { useEffect, useState } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { api } from '../api.js';
import TimelineCard from './TimelineCard.jsx';
import { Loader2, CalendarDays } from 'lucide-react';

const STAT_META = [
  { key: 'independent', label: '独立事件' },
  { key: 'featured', label: '条精选' },
  { key: 'condensed', label: '期日报浓缩' },
  { key: 'readMinutes', label: '分钟读完', prefix: '≈' },
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
 * 周报 / 月报共享视图（对齐目标站：刊名 + 主题 + 导语 + 统计栏 + 编号目录 + 主题分节 + 往期归档）
 */
export default function ReportView({ kind }) {
  const { issue: routeIssue } = useParams();
  const isWeekly = kind === 'weekly';
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [empty, setEmpty] = useState(false);
  const [archive, setArchive] = useState([]);

  const apiLatest = isWeekly ? api.getWeeklyLatest : api.getMonthlyLatest;
  const apiOne = isWeekly ? api.getWeekly : api.getMonthly;
  const apiList = isWeekly ? api.listWeekly : api.listMonthly;
  const basePath = isWeekly ? '/weekly' : '/monthly';
  const title = isWeekly ? 'AI 周报' : 'AI 月报';

  useEffect(() => {
    apiList().then((r) => setArchive(r.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setEmpty(false);
    setReport(null);
    const req = routeIssue ? apiOne(routeIssue) : apiLatest();
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
  }, [routeIssue]);

  const activeIssue = report?.issue || routeIssue || (archive[0] && archive[0].issue);

  return (
    <div className="max-w-[720px] mx-auto px-4 sm:px-6 pt-6 pb-10">
      <div className="flex items-center gap-1 mb-5">
        <TabLink to="/daily" match="/daily" label="日报" />
        <TabLink to="/weekly" match="/weekly" label="周报" />
        <TabLink to="/monthly" match="/monthly" label="月报" />
      </div>

      <div className="mb-5">
        <h1 className="text-[26px] font-bold tracking-tight flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-lg bg-teal-600 grid place-items-center">
            <CalendarDays className="w-4 h-4 text-white" />
          </span>
          {title}
        </h1>
      </div>

      {loading ? (
        <div className="card rounded-panel py-24 grid place-items-center text-ink-500">
          <Loader2 className="w-5 h-5 animate-spin mb-2" />
          <span className="text-[13px]">正在汇编本期内容…</span>
        </div>
      ) : empty || !report ? (
        <div className="card rounded-panel p-12 text-center text-ink-500">
          <div className="text-[14px] font-medium text-ink-900 mb-1">本期暂无内容</div>
          <div className="text-[12.5px]">内容累积后再来生成{title}。</div>
        </div>
      ) : (
        <>
          {/* 刊名 + 期号 + 主题 + 导语 */}
          <div className="mb-4">
            <div className="num text-[13px] font-semibold text-teal-600">{report.issue}</div>
            <h2 className="text-[20px] font-bold leading-snug text-ink-900 mt-1">{report.title}</h2>
            {report.intro && (
              <p className="mt-3 text-[14px] leading-relaxed text-ink-700">{report.intro}</p>
            )}
          </div>

          {/* 统计栏 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-5">
            {STAT_META.map((s) => (
              <div key={s.key} className="card p-3">
                <div className="num text-[20px] font-bold text-ink-900">
                  {s.prefix || ''}
                  {report.stats?.[s.key] ?? '—'}
                </div>
                <div className="text-[12px] text-ink-500 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>

          {/* 编号目录 */}
          {report.sections.length > 0 && (
            <div className="card p-4 mb-6">
              <div className="side-group mb-2 px-1">本期目录</div>
              <ol className="space-y-1">
                {report.sections.map((sec, i) => (
                  <li key={sec.key}>
                    <a
                      href={`#sec-${sec.key}`}
                      className="flex items-center gap-2 text-[13px] text-ink-700 hover:text-teal-600"
                    >
                      <span className="num text-ink-500 w-5">{String(i + 1).padStart(2, '0')}</span>
                      <span>{sec.label}</span>
                      <span className="text-ink-500 ml-auto">{sec.count}</span>
                    </a>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* 主题分节 */}
          <div className="space-y-6">
            {report.sections.map((sec, i) => (
              <section key={sec.key} id={`sec-${sec.key}`}>
                <div className="flex items-center gap-2 mb-2.5">
                  <span className="num text-[13px] font-bold text-teal-600">
                    {String(i + 1).padStart(2, '0')}
                  </span>
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
              <div className="card p-8 text-center text-ink-500">本期暂无分组内容</div>
            )}
          </div>

          {/* 往期归档 */}
          {archive.length > 0 && (
            <div className="mt-8 card p-4">
              <div className="side-group mb-2 px-1">往期归档</div>
              <ul className="space-y-0.5">
                {archive.map((a) => {
                  const active = activeIssue === a.issue;
                  return (
                    <li key={a.issue}>
                      <Link
                        to={`${basePath}/${a.issue}`}
                        className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-[12.5px] transition-colors ${
                          active ? 'bg-teal-100 text-teal-600 font-medium' : 'text-ink-700 hover:bg-paper-1'
                        }`}
                      >
                        <span className="num">{a.issue}</span>
                        <span className="truncate text-ink-500">{a.title}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}
