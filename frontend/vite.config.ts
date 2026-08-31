import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 5173,
    host: true,
    allowedHosts: true,
    // Local dev: proxy API + files to the Express backend so the browser
    // only ever talks to the same origin (no CORS, no localhost in browser code).
    proxy: {
      '/api': 'http://localhost:8081',
      '/file': 'http://localhost:8081',
    },
  },
});
