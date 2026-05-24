import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Single-page app: one index.html mounts /src/main.jsx, all routing is
// handled client-side by react-router. Use absolute base so deep-linked
// routes (e.g. /about) still resolve asset URLs against the site root.
export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    open: '/',
  },
  preview: {
    port: 4173,
  },
});
