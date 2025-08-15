import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const pfxPath = env.VITE_DEV_PFX_PATH
  const pfxPass = env.VITE_DEV_PFX_PASSPHRASE
  const keyPath = path.resolve(__dirname, 'localhost-key.pem')
  const certPath = path.resolve(__dirname, 'localhost.pem')
  const hasPem = fs.existsSync(keyPath) && fs.existsSync(certPath)

  return {
    plugins: [react()],
    server: {
      host: 'localhost',
      port: 5173,
      https: pfxPath && fs.existsSync(pfxPath)
        ? { pfx: fs.readFileSync(pfxPath), passphrase: pfxPass }
        : hasPem
        ? { key: fs.readFileSync(keyPath), cert: fs.readFileSync(certPath) }
        : undefined,
      proxy: {
        '/api': {
          target: 'https://localhost:8443',
          changeOrigin: true,
          secure: false,
        },
      },
    },
  }
})
