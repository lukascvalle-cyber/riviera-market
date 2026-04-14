import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const requiredEnvVars = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'VITE_MAPBOX_TOKEN',
]

export default defineConfig(({ mode }) => {
  if (mode === 'production') {
    for (const key of requiredEnvVars) {
      if (!process.env[key]) {
        throw new Error(`Missing required environment variable: ${key}`)
      }
    }
  }

  return {
    plugins: [react()],
  }
})
