import { defineConfig } from 'vitest/config'

// Tests unitaires des fonctions pures (Worker et front), exécutés sous Node.
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts', 'web/src/**/*.test.ts'],
  },
})
