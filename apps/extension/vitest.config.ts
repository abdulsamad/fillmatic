import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json-summary', 'json'],
      include: ['src/**/*.{ts,tsx}'],
      // Bootstrap/type-only files have no meaningful runtime logic to cover.
      exclude: [
        'src/autofill/index.ts',
        'src/utils/user-profiles.ts',
        'src/utils/user-rules.ts',
        'src/types/index.ts',
        'src/global.d.ts',
        'src/options/index.tsx',
        'src/popup/index.tsx',
        'src/manifest.ts',
      ],
      // Ratchet this floor up as coverage improves; never lower it without cause.
      thresholds: {
        statements: 78,
        branches: 65,
        functions: 82,
        lines: 78,
      },
    },
  },
})
