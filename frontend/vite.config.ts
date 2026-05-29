import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import { createPluginRollupOptions } from '../../gress/gress-plugin-packages/plugin-vite-externals.ts'

export default defineConfig({
  plugins: [vue()],
  define: {
    'process.env': {}
  },
  build: {
    minify: true,
    cssCodeSplit: true,
    lib: {
      entry: fileURLToPath(new URL('./src/index.ts', import.meta.url)),
      name: '__GRESS_PLUGIN__',
      formats: ['iife'],
      fileName: () => 'kb-frontend.umd.js'
    },
    rollupOptions: createPluginRollupOptions()
  }
})
