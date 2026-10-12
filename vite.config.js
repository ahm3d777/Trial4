import { resolve } from 'node:path';
import { defineConfig } from 'vite';

const root = import.meta.dirname;

export default defineConfig({
  // Relative base so the build works from any sub-path (e.g. GitHub Pages).
  base: './',
  build: {
    target: 'es2022',
    // html2pdf.js (~900 kB) is already lazy-loaded only when the user picks
    // "Quick download", so it never affects initial page load.
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      input: {
        main: resolve(root, 'index.html'),
        editor: resolve(root, 'editor.html'),
      },
    },
  },
  server: { port: 5173 },
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.js'],
    // Unit tests cover the pure core; DOM-heavy UI is covered by Playwright (tests/e2e).
    coverage: {
      include: ['src/core/**/*.js', 'src/templates/**/*.js'],
      thresholds: { lines: 90, functions: 85, branches: 80 },
    },
  },
});
