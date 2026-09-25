import { describe, expect, it } from 'vitest'
import { libelleAppareil, origineAttendue } from './passkey'

describe('origineAttendue', () => {
  it('accepte le site lui-même en https : RP ID = nom d’hôte', () => {
    expect(origineAttendue('https://condat-judo.example.org', 'https://condat-judo.example.org/api/auth/passkey/connexion')).toEqual({
      origine: 'https://condat-judo.example.org',
      rpID: 'condat-judo.example.org',
    })
  })

  it('accepte localhost en http (Vite :5173 relaie vers le Worker :8787)', () => {
    expect(origineAttendue('http://localhost:5173', 'http://localhost:8787/api/auth/passkey/connexion')).toEqual({
      origine: 'http://localhost:5173',
      rpID: 'localhost',
    })
  })

  it('refuse une autre origine, du http hors localhost, une origine absente ou invalide', () => {
    const url = 'https://condat-judo.example.org/api/auth/passkey/connexion'
    expect(origineAttendue('https://pirate.example.com', url)).toBeNull()
    expect(origineAttendue('http://condat-judo.example.org', url)).toBeNull()
    expect(origineAttendue(undefined, url)).toBeNull()
    expect(origineAttendue('null', url)).toBeNull()
  })
})

describe('libelleAppareil', () => {
  it('nettoie et raccourcit le libellé, avec une valeur par défaut', () => {
    expect(libelleAppareil('  iPhone   ·  Safari ')).toBe('iPhone · Safari')
    expect(libelleAppareil('x'.repeat(100))).toHaveLength(60)
    expect(libelleAppareil(undefined)).toBe('Appareil')
    expect(libelleAppareil('   ')).toBe('Appareil')
  })
})
