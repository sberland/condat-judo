import { defineConfig } from 'vitest/config'

// Tests unitaires des fonctions pures du Worker (Node, WebCrypto natif).
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
  },
})
