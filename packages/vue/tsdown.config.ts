import { defineConfig } from 'tsdown'
import Vue from 'unplugin-vue/rolldown'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  plugins: [Vue({ isProduction: true })],
  dts: { vue: true },
  clean: true,
})
