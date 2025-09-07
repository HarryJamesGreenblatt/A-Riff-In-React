import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'build'
  },
  define: {
    'process.env.VITE_API_URL': JSON.stringify(process.env.VITE_API_URL),
    'process.env.VITE_EXTERNAL_CLIENT_ID': JSON.stringify(process.env.VITE_EXTERNAL_CLIENT_ID),
    'process.env.VITE_EXTERNAL_TENANT_ID': JSON.stringify(process.env.VITE_EXTERNAL_TENANT_ID)
  }
})
