import { Routes, Route, NavLink } from 'react-router-dom';
import { Radio, Search, Tag, Activity } from 'lucide-react';
import Home from './pages/Home.jsx';
import SearchPage from './pages/Search.jsx';
import Keywords from './pages/Keywords.jsx';

function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-white/5 bg-ink-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative w-9 h-9 grid place-items-center rounded-lg bg-plasma-500/15 border border-plasma-400/30">
            <Radio className="w-5 h-5 text-plasma-400" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-cyan-400 animate-pulse-fast" />
          </div>
          <div>
            <div className="font-display font-bold tracking-wide text-lg leading-none">AIHotPoint</div>
            <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500 mt-0.5">
              CROSS-SOURCE · HOTSPOT RADAR
            </div>
          </div>
        </div>
        <nav className="flex items-center gap-1">
          {[
            { to: '/', label: '实时热点', icon: Activity },
            { to: '/search', label: '搜索', icon: Search },
            { to: '/keywords', label: '关键词', icon: Tag },
          ].map((it) => (
            <NavLink
              key={it.to}
              to={it.to}
              end={it.to === '/'}
              className={({ isActive }) =>
                `inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-plasma-500/20 text-plasma-400 border border-plasma-400/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
                }`
              }
            >
              <it.icon className="w-4 h-4" />
              {it.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}

export default function App() {
  return (
    <div className="min-h-full grid-bg">
      <Header />
      <main className="max-w-7xl mx-auto px-6 py-8">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/keywords" element={<Keywords />} />
        </Routes>
      </main>
      <footer className="text-center text-[11px] font-mono uppercase tracking-widest text-slate-600 py-6">
        AIHotPoint · Powered by Qwen + 8 Sources · {new Date().getFullYear()}
      </footer>
    </div>
  );
}
