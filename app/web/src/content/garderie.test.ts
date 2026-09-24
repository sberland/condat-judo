import { describe, expect, it } from 'vitest'
import { estMercredi, libelleLimite, limiteDemande, maintenantParis, mercredisOuverts, modifiable, tousLesMercredis } from './garderie'
import { copierReferentiel, validerReferentiel } from './referentiel'
import { REFERENTIEL_2026_2027 } from './referentiel-initial'

const G = REFERENTIEL_2026_2027.garderie

describe('calendrier des mercredis', () => {
  it('reconnaît les mercredis', () => {
    expect(estMercredi('2026-09-23')).toBe(true)
    expect(estMercredi('2026-09-24')).toBe(false)
    expect(estMercredi('23/09/2026')).toBe(false)
  })

  it('tous les mercredis de la période, bornes comprises', () => {
    const tous = tousLesMercredis(G.debut, G.fin)
    expect(tous[0]).toBe('2026-09-02')
    expect(tous.at(-1)).toBe('2027-06-30')
    expect(tous).toHaveLength(44)
  })

  it('sans les mercredis fermés', () => {
    const ouverts = mercredisOuverts({ ...G, fermes: ['2026-10-21', '2026-10-28'] })
    expect(ouverts).toHaveLength(42)
    expect(ouverts).not.toContain('2026-10-21')
  })
})

describe('délai de demande', () => {
  it('par défaut la veille à 20 h', () => {
    expect(limiteDemande(G, '2026-09-30')).toBe('2026-09-29 20:00')
    expect(libelleLimite(G)).toBe('la veille à 20 h')
    expect(modifiable(G, '2026-09-30', '2026-09-29 19:59')).toBe(true)
    expect(modifiable(G, '2026-09-30', '2026-09-29 20:00')).toBe(false)
  })

  it('réglable : le jour même à midi', () => {
    const g = { ...G, limite: { jours: 0, heure: '12:00' } }
    expect(limiteDemande(g, '2026-09-30')).toBe('2026-09-30 12:00')
    expect(libelleLimite(g)).toBe('le jour même à 12 h')
    expect(libelleLimite({ ...G, limite: { jours: 2, heure: '18:30' } })).toBe('2 jours avant, à 18 h 30')
  })

  it('l’heure s’entend à Paris', () => {
    // 29/09/2026 18:30 UTC = 20:30 à Paris (heure d'été).
    expect(maintenantParis(new Date('2026-09-29T18:30:00Z'))).toBe('2026-09-29 20:30')
  })
})

describe('réglages dans le référentiel', () => {
  it('la saison suivante garde lieux et délai, décale la période sur des mercredis, rouvre les fermés', () => {
    const suivant = copierReferentiel({ ...REFERENTIEL_2026_2027, garderie: { ...G, fermes: ['2026-10-21'], provisoire: false } }).garderie
    expect(suivant).toMatchObject({ lieux: G.lieux, limite: G.limite, fermes: [], provisoire: true })
    expect(estMercredi(suivant.debut) && estMercredi(suivant.fin)).toBe(true)
    expect(suivant.debut).toBe('2027-09-08')
    expect(suivant.fin).toBe('2028-06-28')
  })

  it('validation : des mercredis, au moins un lieu, un délai correct', () => {
    const r = structuredClone(REFERENTIEL_2026_2027)
    r.garderie = { ...G, debut: '2026-09-03', lieux: [], limite: { jours: 9, heure: '25:00' }, fermes: ['2026-10-22'] }
    const v = validerReferentiel(r)
    expect(!v.ok && v.erreurs.garderie).toBe('Premier et dernier jour : des mercredis')
    expect(!v.ok && v.erreurs['garderie.lieux']).toBeTruthy()
    expect(!v.ok && v.erreurs['garderie.limite']).toBeTruthy()
    expect(!v.ok && v.erreurs['garderie.fermes']).toBeTruthy()
  })
})
