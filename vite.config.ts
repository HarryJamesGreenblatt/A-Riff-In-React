import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// PostCSS plugins are configured in postcss.config.cjs

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'build'
  }
  // PostCSS is configured via postcss.config.cjs
})
