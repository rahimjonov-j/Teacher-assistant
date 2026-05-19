import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

const LOCAL_API_URL = 'http://localhost:4000/api'
const PRODUCTION_API_URL = 'https://teacher-assistant-api-kk0n.onrender.com/api'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const rootDir = path.resolve(__dirname, '../..')
  const rawEnv = loadEnv(mode, rootDir, '')
  const fallbackApiUrl = mode === 'production' ? PRODUCTION_API_URL : LOCAL_API_URL

  return {
    envDir: rootDir,
    envPrefix: ['VITE_', 'SUPABASE_'],
    define: {
      __APP_ENV__: JSON.stringify({
        API_URL: rawEnv.VITE_API_URL || fallbackApiUrl,
        SUPABASE_URL: rawEnv.VITE_SUPABASE_URL || rawEnv.SUPABASE_URL || '',
        SUPABASE_ANON_KEY:
          rawEnv.VITE_SUPABASE_ANON_KEY || rawEnv.SUPABASE_ANON_KEY || '',
      }),
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(moduleId) {
            if (!moduleId.includes('node_modules')) {
              return undefined
            }

            if (moduleId.includes('react-markdown')) {
              return 'vendor-markdown'
            }

            if (moduleId.includes('recharts')) {
              return 'vendor-charts'
            }

            if (moduleId.includes('@supabase/supabase-js')) {
              return 'vendor-supabase'
            }

            if (moduleId.includes('@tanstack/react-query')) {
              return 'vendor-query'
            }

            if (moduleId.includes('react-router-dom') || moduleId.includes('/react/') || moduleId.includes('/react-dom/')) {
              return 'vendor-react'
            }

            if (moduleId.includes('lucide-react') || moduleId.includes('sonner')) {
              return 'vendor-ui'
            }

            return undefined
          },
        },
      },
    },
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  }
})
