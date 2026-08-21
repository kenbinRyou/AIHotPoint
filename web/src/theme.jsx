import { createContext, useContext, useEffect, useState } from 'react';

// 主题：深色 / 浅色 / 跟随系统（对齐目标站侧栏 radiogroup）
const KEY = 'aihot-theme';
const MODES = ['dark', 'system', 'light'];

const ThemeCtx = createContext({ mode: 'system', setMode: () => {} });

function resolve(mode) {
  if (mode !== 'system') return mode;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(() => {
    const saved = localStorage.getItem(KEY);
    // 默认深色（对齐目标站；已存偏好的用户不受影响）
    return MODES.includes(saved) ? saved : 'dark';
  });

  useEffect(() => {
    localStorage.setItem(KEY, mode);
    const apply = () =>
      document.documentElement.classList.toggle('dark', resolve(mode) === 'dark');
    apply();
    if (mode === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      mq.addEventListener('change', apply);
      return () => mq.removeEventListener('change', apply);
    }
  }, [mode]);

  return <ThemeCtx.Provider value={{ mode, setMode }}>{children}</ThemeCtx.Provider>;
}

export const useTheme = () => useContext(ThemeCtx);
