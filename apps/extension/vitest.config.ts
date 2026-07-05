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
      reporter: ['text', 'html'],
      // Scoped to the modules that currently have tests (core autofill value
      // generation + element/field matching). Widen this as more areas get covered.
      include: ['src/autofill/generateValue.ts', 'src/utils/actions.ts', 'src/utils/index.ts'],
    },
  },
})
