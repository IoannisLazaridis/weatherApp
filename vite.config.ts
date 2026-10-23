import { defineConfig } from 'vitest/config';

export default defineConfig({
  build: {
    target: 'es2022',
    sourcemap: true,
  },
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.test.ts'],
    restoreMocks: true,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      // DOM wiring is exercised by the Playwright end-to-end suite instead.
      exclude: ['src/main.ts', 'src/ui/search.ts'],
      reporter: ['text', 'json-summary', 'html', 'lcov'],
      thresholds: { statements: 85, branches: 65, functions: 85, lines: 85 },
    },
  },
});
