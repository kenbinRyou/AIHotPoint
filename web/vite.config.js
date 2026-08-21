import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
      // RSS 输出（/feed.xml 等）同源转发，避免开发模式下 404
      '/feed': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
});
