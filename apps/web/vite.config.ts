import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const rootDir = path.resolve(__dirname, '../..')
  const rawEnv = loadEnv(mode, rootDir, '')

  return {
    envDir: rootDir,
    envPrefix: ['VITE_', 'SUPABASE_'],
    define: {
      __APP_ENV__: JSON.stringify({
        API_URL: rawEnv.VITE_API_URL || 'http://localhost:4000/api',
        SUPABASE_URL: rawEnv.VITE_SUPABASE_URL || rawEnv.SUPABASE_URL || '',
        SUPABASE_ANON_KEY:
          rawEnv.VITE_SUPABASE_ANON_KEY || rawEnv.SUPABASE_ANON_KEY || '',
        TELEGRAM_BOT_USERNAME:
          rawEnv.VITE_TELEGRAM_BOT_USERNAME || rawEnv.TELEGRAM_BOT_USERNAME || '',
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

            if (moduleId.includes('@supabase/supabase-js') || moduleId.includes('@tanstack/react-query')) {
              return 'vendor-supabase'
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
