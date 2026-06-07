import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

function apiProxy() {
  let target = ''
  let apiKey = ''

  return {
    name: 'api-proxy',
    configResolved(config) {
      target = config.env.VITE_CRM_API_URL || process.env.VITE_CRM_API_URL || ''
      apiKey = config.env.VITE_CRM_API_KEY || process.env.VITE_CRM_API_KEY || ''
    },
    configureServer(server) {
      if (!target || !apiKey) {
        console.warn('[api-proxy] VITE_CRM_API_URL and VITE_CRM_API_KEY required for API calls')
        return
      }

      server.middlewares.use('/api', async (req, res) => {
        try {
          let body = undefined
          if (req.method !== 'GET' && req.method !== 'HEAD') {
            body = await new Promise((resolve) => {
              let data = ''
              req.on('data', (c) => (data += c))
              req.on('end', () => resolve(data || ''))
            })
          }

          const headers = {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
          }
          if (body) headers['Content-Length'] = String(Buffer.byteLength(body))

          const response = await fetch(target + req.url, {
            method: req.method,
            headers,
            body: body || undefined,
          })

          const text = await response.text()
          res.writeHead(response.status, {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          })
          res.end(text)
        } catch (err) {
          console.error('[api-proxy]', err.message)
          res.writeHead(502, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'Proxy error: ' + err.message }))
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), apiProxy()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
        },
      },
    },
  },
})
