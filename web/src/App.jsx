import { useEffect, useState } from 'react';
import { Routes, Route, NavLink, Link, useLocation } from 'react-router-dom';
import {
  Radio, Activity, Rss, Flame, Star, Moon, Sun, MonitorSmartphone,
  Newspaper, Shapes, Trophy, Bot, Info, History, MessageSquare,
} from 'lucide-react';
import { useTheme } from './theme.jsx';
import Home from './pages/Home.jsx';
import All from './pages/All.jsx';
import Hot from './pages/Hot.jsx';
import Starred from './pages/Starred.jsx';
import SearchPage from './pages/Search.jsx';
import Keywords from './pages/Keywords.jsx';
import ItemDetail from './pages/ItemDetail.jsx';
import StoryDetail from './pages/StoryDetail.jsx';
import Daily from './pages/Daily.jsx';
import Weekly from './pages/Weekly.jsx';
import Monthly from './pages/Monthly.jsx';
import Topics from './pages/Topics.jsx';
import TopicDetail from './pages/TopicDetail.jsx';
import Leaderboard from './pages/Leaderboard.jsx';
import Agent from './pages/Agent.jsx';
import About from './pages/About.jsx';
import Changelog from './pages/Changelog.jsx';
import Feedback from './pages/Feedback.jsx';

// 更新日志未读状态（侧栏红点）：版本号变更即视为有未读
const CHANGELOG_VERSION = '2026.08.21';
const CL_KEY = 'aihot-changelog-read';
const markChangelogRead = () => { try { localStorage.setItem(CL_KEY, CHANGELOG_VERSION); } catch {} };
const isChangelogUnread = () => { try { return localStorage.getItem(CL_KEY) !== CHANGELOG_VERSION; } catch { return false; } };

// 分组导航（对齐目标站：内容 / 模型 / 更多）
const NAV_GROUPS = [
  {
    label: '内容',
    items: [
      { to: '/', label: '精选', icon: Activity, end: true },
      { to: '/all', label: '全部 AI 动态', icon: Rss, end: false },
      { to: '/hot', label: '热点榜', icon: Flame, end: false },
      { to: '/daily', label: 'AI 日报', icon: Newspaper, end: false },
      { to: '/topics', label: '主题', icon: Shapes, end: false },
      { to: '/starred', label: '收藏', icon: Star, end: false },
    ],
  },
  {
    label: '模型',
    items: [
      { to: '/leaderboard', label: '模型榜', icon: Trophy, end: false },
    ],
  },
  {
    label: '更多',
    items: [
      { to: '/agent', label: 'Agent 接入', icon: Bot, end: false },
      { to: '/about', label: '关于', icon: Info, end: false },
      { to: '/changelog', label: '更新日志', icon: History, end: false, changelog: true },
      { to: '/feedback', label: '反馈', icon: MessageSquare, end: false },
    ],
  },
];

function Brand() {
  return (
    <Link to="/" className="flex items-center gap-2 select-none">
      <svg width="26" height="26" viewBox="0 0 32 32" aria-label="AIHotPoint">
        <rect width="32" height="32" rx="7" fill="var(--accent)" />
        <path
          d="M9 21 L13 9 L16 18 L19 12 L23 21"
          fill="none"
          stroke="white"
          strokeWidth="2.4"
          strokeLinejoin="round"
        />
      </svg>
      <span className="text-[17px] font-bold tracking-tight text-ink-900">
        AIHotPoint
      </span>
    </Link>
  );
}

function NavItems({ onNavigate, variant = 'vertical', clUnread, onMarkChangelog }) {
  const flat = NAV_GROUPS.flatMap((g) => g.items);
  if (variant === 'horizontal') {
    return flat.map((it) => (
      <NavLink
        key={it.to}
        to={it.to}
        end={it.end}
        onClick={onNavigate}
        className={({ isActive }) =>
          `flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
            isActive
              ? 'text-white font-medium nav-pill-active'
              : 'text-ink-700 hover:text-ink-900 hover:bg-paper-1'
          }`
        }
      >
        <it.icon className="w-3.5 h-3.5 shrink-0" />
        {it.label}
      </NavLink>
    ));
  }
  return NAV_GROUPS.map((g) => (
    <div key={g.label} className="mb-1">
      <div className="side-group mb-1 mt-1">{g.label}</div>
      {g.items.map((it) => (
        <NavLink
          key={it.to}
          to={it.to}
          end={it.end}
          onClick={() => {
            onNavigate?.();
            if (it.changelog) onMarkChangelog?.();
          }}
          className={({ isActive }) =>
            `side-item ${isActive ? 'side-item-active' : ''}`
          }
        >
          <it.icon className="w-4 h-4 shrink-0" />
          <span className="flex-1">{it.label}</span>
          {it.changelog && clUnread && (
            <span
              className="w-1.5 h-1.5 rounded-full bg-[#d86a52]"
              title="有更新"
              aria-label="有更新"
            />
          )}
        </NavLink>
      ))}
    </div>
  ));
}

/** 主题切换：深色 / 跟随系统 / 浅色（对齐目标站侧栏底部 radiogroup） */
function ThemeSwitch() {
  const { mode, setMode } = useTheme();
  const opts = [
    { key: 'dark', label: '深色', icon: Moon },
    { key: 'system', label: '系统', icon: MonitorSmartphone },
    { key: 'light', label: '浅色', icon: Sun },
  ];
  return (
    <div
      role="radiogroup"
      aria-label="主题"
      className="flex items-center gap-1 rounded-lg bg-paper-1 p-0.5"
    >
      {opts.map((o) => (
        <button
          key={o.key}
          role="radio"
          aria-checked={mode === o.key}
          title={o.label}
          onClick={() => setMode(o.key)}
          className={`flex-1 flex items-center justify-center gap-1 rounded-md py-1 text-[11px] transition-colors cursor-pointer ${
            mode === o.key
              ? 'bg-card text-ink-900 font-medium'
              : 'text-ink-500 hover:text-ink-900'
          }`}
        >
          <o.icon className="w-3 h-3" />
          <span className="hidden sm:inline">{o.label}</span>
        </button>
      ))}
    </div>
  );
}

/** 左侧固定侧栏：品牌 / 分组导航 / 主题切换 / 页脚 */
function Sidebar({ clUnread, onMarkChangelog }) {
  return (
    <aside className="hidden lg:flex flex-col sticky top-0 h-screen w-[180px] shrink-0 bg-card border-r border-paper-2">
      <div className="px-4 pt-5 pb-4">
        <Brand />
        <div className="mt-2 text-[11px] text-ink-500 pl-[34px]">AI 热点雷达</div>
      </div>
      <div className="divider mx-4" />
      <nav className="flex-1 overflow-y-auto flex flex-col gap-0.5 px-3 pt-3">
        <NavItems clUnread={clUnread} onMarkChangelog={onMarkChangelog} />
      </nav>
      <div className="px-4 py-3 space-y-3">
        <ThemeSwitch />
        <div className="text-[11px] text-ink-500 leading-relaxed">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-600 animate-pulse-dot" />
            多源实时抓取 · AI 评级
          </div>
          Powered by Qwen · {new Date().getFullYear()}
        </div>
      </div>
    </aside>
  );
}

/** 移动端顶栏：品牌 + 横向导航 + 主题切换 */
function MobileTopBar({ clUnread, onMarkChangelog }) {
  const { mode, setMode } = useTheme();
  const cycle = () => setMode(mode === 'dark' ? 'light' : mode === 'light' ? 'system' : 'dark');
  return (
    <header className="lg:hidden sticky top-0 z-30 bg-card backdrop-blur border-b border-paper-2">
      <div className="flex items-center justify-between px-4 pt-3 pb-1">
        <Brand />
        <button
          onClick={cycle}
          title="切换主题（深色 / 浅色 / 跟随系统）"
          aria-label="切换主题"
          className="star-btn"
        >
          {mode === 'dark' ? (
            <Moon className="w-4 h-4" />
          ) : mode === 'light' ? (
            <Sun className="w-4 h-4" />
          ) : (
            <MonitorSmartphone className="w-4 h-4" />
          )}
        </button>
      </div>
      <nav className="flex gap-1 px-3 pb-2 overflow-x-auto">
        <NavItems variant="horizontal" clUnread={clUnread} onMarkChangelog={onMarkChangelog} />
      </nav>
    </header>
  );
}

export default function App() {
  const location = useLocation();
  const [clUnread, setClUnread] = useState(isChangelogUnread);
  useEffect(() => {
    if (location.pathname.startsWith('/changelog')) {
      markChangelogRead();
      setClUnread(false);
    }
  }, [location.pathname]);

  return (
    <div className="flex min-h-full">
      <Sidebar clUnread={clUnread} onMarkChangelog={() => setClUnread(false)} />
      <main className="flex-1 min-w-0">
        <MobileTopBar clUnread={clUnread} onMarkChangelog={() => setClUnread(false)} />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/all" element={<All />} />
          <Route path="/hot" element={<Hot />} />
          <Route path="/daily" element={<Daily />} />
          <Route path="/daily/:date" element={<Daily />} />
          <Route path="/weekly" element={<Weekly />} />
          <Route path="/weekly/:issue" element={<Weekly />} />
          <Route path="/monthly" element={<Monthly />} />
          <Route path="/monthly/:issue" element={<Monthly />} />
          <Route path="/topics" element={<Topics />} />
          <Route path="/topics/:key" element={<TopicDetail />} />
          <Route path="/starred" element={<Starred />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/keywords" element={<Keywords />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/agent" element={<Agent />} />
          <Route path="/about" element={<About />} />
          <Route path="/changelog" element={<Changelog />} />
          <Route path="/feedback" element={<Feedback />} />
          <Route path="/items/:id" element={<ItemDetail />} />
          <Route path="/story/:id" element={<StoryDetail />} />
        </Routes>
        <footer className="mt-10 border-t border-paper-2">
          <div className="max-w-[720px] mx-auto px-6 py-5 flex items-center justify-between text-[11px] text-ink-500">
            <span className="flex items-center gap-1.5">
              <Radio className="w-3 h-3" />
              AIHotPoint · 跨源热点雷达
            </span>
            <span>多源聚合 · Powered by Qwen</span>
          </div>
        </footer>
      </main>
    </div>
  );
}
