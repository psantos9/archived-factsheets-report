import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import leanix from 'vite-plugin-lxr'
import graphqlLoader from 'vite-plugin-graphql-loader'

// https://vitejs.dev/config/
export default defineConfig({
  // @ts-ignore
  plugins: [vue(), leanix.default(), graphqlLoader()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  build: {
    rollupOptions: {
      input: {
        app: './index.html'
      }
    }
  }
})
