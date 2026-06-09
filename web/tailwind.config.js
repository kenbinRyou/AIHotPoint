/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Noto Sans SC"', '"Inter"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'ui-monospace', 'monospace'],
        display: ['"Space Grotesk"', '"Noto Sans SC"', 'sans-serif'],
      },
      colors: {
        // Cyberpunk Editorial 调色板
        ink: {
          950: '#05060A',  // 背景最深
          900: '#0A0C14',  // 主背景
          800: '#10131D',  // 卡片背景
          700: '#171A26',
          600: '#1F2333',
        },
        plasma: {
          400: '#7A6BFF',
          500: '#5B4DE8',
          600: '#4338CA',
        },
        heat: {
          1: '#3B82F6',   // cold blue
          2: '#22D3EE',   // cyan
          3: '#A3E635',   // lime
          4: '#FACC15',   // yellow
          5: '#FB923C',   // orange
          6: '#EF4444',   // hot red
          7: '#B91C1C',   // urgent
        },
      },
      keyframes: {
        'pulse-fast': { '0%,100%': { opacity: '1' }, '50%': { opacity: '.4' } },
        'slide-in': { '0%': { transform: 'translateX(20px)', opacity: '0' }, '100%': { transform: 'translateX(0)', opacity: '1' } },
        'scan': { '0%': { backgroundPosition: '0% 0%' }, '100%': { backgroundPosition: '0% 100%' } },
        'shimmer': { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        'glow': { '0%,100%': { boxShadow: '0 0 8px rgba(123,107,255,0.4)' }, '50%': { boxShadow: '0 0 16px rgba(123,107,255,0.8)' } },
      },
      animation: {
        'pulse-fast': 'pulse-fast 1.2s ease-in-out infinite',
        'slide-in': 'slide-in 240ms ease-out',
        'scan': 'scan 4s linear infinite',
        'shimmer': 'shimmer 2.4s linear infinite',
        'glow': 'glow 2.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
