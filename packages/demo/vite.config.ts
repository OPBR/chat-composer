import { defineConfig } from 'vite'
import { resolve } from 'node:path'

export default defineConfig({
  resolve: {
    alias: {
      '@chat-composer/core': resolve(__dirname, '../core/src/index.ts'),
    },
    dedupe: ['@chat-composer/core'],
  },
  server: {
    open: true,
    host: true,
  },
})
