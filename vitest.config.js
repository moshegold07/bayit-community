import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.js',
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      thresholds: { statements: 20, branches: 15, functions: 20, lines: 20 },
      exclude: ['node_modules/**', 'dist/**', 'tests/**', '**/*.config.*', 'src/main.jsx'],
    },
  },
});
