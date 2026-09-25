import { describe, expect, it } from 'vitest'
import { libelleAppareil, nomDeverrouillage } from './passkey'

const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1'
const ANDROID = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36'
const SAMSUNG = 'Mozilla/5.0 (Linux; Android 14; SM-S921B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/26.0 Chrome/122.0.0.0 Mobile Safari/537.36'
const EDGE = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0'

describe('libelleAppareil', () => {
  it('reconnaît le téléphone et le navigateur', () => {
    expect(libelleAppareil(IPHONE)).toBe('iPhone · Safari')
    expect(libelleAppareil(ANDROID)).toBe('Android · Chrome')
    expect(libelleAppareil(SAMSUNG)).toBe('Android · Samsung Internet')
    expect(libelleAppareil(EDGE)).toBe('PC Windows · Edge')
    expect(libelleAppareil('curl/8.0')).toBe('Appareil')
  })
})

describe('nomDeverrouillage', () => {
  it('nomme le déverrouillage selon l’appareil', () => {
    expect(nomDeverrouillage(IPHONE)).toBe('Face ID')
    expect(nomDeverrouillage(ANDROID)).toBe('l’empreinte')
    expect(nomDeverrouillage(EDGE)).toBe('Windows Hello')
  })
})
