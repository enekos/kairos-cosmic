import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

// Multi-page setup: each HTML file at the root of `frontend/` is an entry.
// `kairos.html` mounts the React app via /src/main.jsx; the others are
// static marketing/auth pages that just pull in the shared stylesheets.
export default defineConfig({
  plugins: [react()],
  // Relative base so the same build can be served from / or from a project
  // subpath on GitHub Pages without a separate config.
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        index:  resolve(__dirname, 'index.html'),
        about:  resolve(__dirname, 'about.html'),
        kairos: resolve(__dirname, 'kairos.html'),
        legal:  resolve(__dirname, 'legal.html'),
        login:  resolve(__dirname, 'login.html'),
        signup: resolve(__dirname, 'signup.html'),
      },
    },
  },
  server: {
    port: 5173,
    open: '/index.html',
  },
  preview: {
    port: 4173,
  },
});
