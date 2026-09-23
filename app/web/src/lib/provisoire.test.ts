import { describe, expect, it } from 'vitest'
import { afficherProvisoire } from './provisoire'

describe('afficherProvisoire — les valeurs de remplacement ne sortent jamais en production', () => {
  it('affiche en local et en qualification', () => {
    expect(afficherProvisoire('local')).toBe(true)
    expect(afficherProvisoire('preview')).toBe(true)
  })

  it('masque en production', () => {
    expect(afficherProvisoire('production')).toBe(false)
  })

  it('masque tant que l’environnement est inconnu', () => {
    expect(afficherProvisoire(undefined)).toBe(false)
  })
})
