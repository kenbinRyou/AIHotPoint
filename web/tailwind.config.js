/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', '"PingFang SC"', '"Hiragino Sans GB"', '"HarmonyOS Sans SC"', '"Microsoft YaHei"', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', '"SF Mono"', 'Menlo', 'Consolas', 'monospace'],
      },
      colors: {
        // AIHOT 编辑风调色板（对齐 aihot.virxact.com），浅/深主题经 CSS 变量切换
        paper: {
          0: 'var(--bg-0)', // 页面背景
          1: 'var(--bg-1)', // 次级背景 / 日期条
          2: 'var(--bg-2)', // 分割线 / 边框
        },
        ink: {
          900: 'var(--text-0)', // 主文字
          700: 'var(--text-1)', // 次级文字
          500: 'var(--text-2)', // 弱文字
          300: 'var(--text-3)',
        },
        teal: {
          600: 'var(--accent)',      // 主强调色
          500: 'var(--accent)',      // 兼容旧引用
          700: 'var(--accent-hover)',
          100: 'var(--accent-ghost)',
        },
        card: 'var(--card)',
        // 热度色阶（热点榜）
        heat: {
          1: '#3b82f6',
          2: '#22d3ee',
          3: '#a3e635',
          4: '#facc15',
          5: '#fb923c',
          6: '#ef4444',
          7: '#b91c1c',
        },
      },
      borderRadius: {
        card: '12px',
        panel: '16px',
      },
      keyframes: {
        'slide-in': { '0%': { transform: 'translateY(6px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
        'fade-in': { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        'pulse-dot': { '0%,100%': { opacity: '1' }, '50%': { opacity: '.35' } },
      },
      animation: {
        'slide-in': 'slide-in 240ms ease-out',
        'fade-in': 'fade-in 200ms ease-out',
        'pulse-dot': 'pulse-dot 1.6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
