import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Front React. Vit dans app/web/, build → app/web/dist (servi par le Worker via Workers Assets).
// Version = app/package.json (source unique), injectée dans le front via __APP_VERSION__.
const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as { version: string }

export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  // En dev, proxy vers le Worker (npm run dev, :8787) pour l'API. Worker lancé en parallèle.
  server: {
    port: 5173,
    strictPort: true,
    proxy: { '/api': 'http://localhost:8787' },
  },
  build: { outDir: 'dist', emptyOutDir: true },
})
