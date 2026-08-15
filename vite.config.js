import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  // Same-origin backend (xindeler-web-api) in production is reached via
  // nginx on the same domain as the landing itself — /api/* resolves there
  // with no CORS involved. In dev there's no local nginx, so this proxy
  // stands in for it; it defaults to production so `npm run dev` keeps
  // working out of the box, and can be pointed at a local xindeler-web-api
  // instance via VITE_API_PROXY_TARGET in .env.local (gitignored).
  const apiProxyTarget = env.VITE_API_PROXY_TARGET || 'https://xindeler.com'

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target: apiProxyTarget,
          changeOrigin: true,
          secure: true,
        },
      },
    },
  }
})
