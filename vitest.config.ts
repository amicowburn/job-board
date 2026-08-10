import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

/**
 * The suite covers the pure analytics logic in `lib/analytics/`, which has no
 * DOM and no database dependency — hence the plain node environment and no
 * jsdom. Adding either would slow every run down for nothing.
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['lib/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('.', import.meta.url)),
    },
  },
})
