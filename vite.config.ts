import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'build'
  },
  define: {
    'process.env.REACT_APP_API_URL': JSON.stringify(process.env.REACT_APP_API_URL),
    'process.env.REACT_APP_CLIENT_ID': JSON.stringify(process.env.REACT_APP_CLIENT_ID),
    'process.env.REACT_APP_TENANT_ID': JSON.stringify(process.env.REACT_APP_TENANT_ID)
  }
})
