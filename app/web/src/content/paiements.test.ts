import { describe, expect, it } from 'vitest'
import { cumul, echeancier, exigible, repartir, situation } from './paiements'
import { REFERENTIEL_2026_2027 } from './referentiel-initial'

const comptant = { montant_total: 14700, paiement_3_fois: 0, echeance_1: 8000, echeance_2: 3400, echeance_3: 3300 }
const en3fois = { ...comptant, paiement_3_fois: 1 }
const DATES = REFERENTIEL_2026_2027.echeances3Fois.dates
const [date2, date3] = DATES

describe('échéancier', () => {
  it('comptant : tout est dû à l’inscription', () => {
    expect(echeancier(comptant, DATES)).toEqual([{ montant: 14700, date: null }])
    expect(exigible(comptant, '2026-09-01', DATES)).toBe(14700)
  })

  it('en 3 fois : 1er versement tout de suite, les suivants à leur date', () => {
    expect(echeancier(en3fois, DATES).map((v) => v.montant)).toEqual([8000, 3400, 3300])
    expect(exigible(en3fois, '2026-10-01', DATES)).toBe(8000)
    expect(exigible(en3fois, date2, DATES)).toBe(11400)
    expect(exigible(en3fois, date3, DATES)).toBe(14700)
  })
})

describe('situation', () => {
  it('à payer, partiel, soldé, trop-perçu', () => {
    expect(situation(14700, 0, 8000)).toMatchObject({ statut: 'a_payer', restant: 14700, retard: 8000 })
    expect(situation(14700, 8000, 8000)).toMatchObject({ statut: 'partiel', restant: 6700, retard: 0 })
    expect(situation(14700, 14700, 14700)).toMatchObject({ statut: 'solde', restant: 0, tropPercu: 0 })
    expect(situation(14700, 15000, 14700)).toMatchObject({ statut: 'solde', restant: 0, tropPercu: 300 })
  })

  it('famille de deux enfants, réduction famille comprise : les restants s’additionnent', () => {
    const lea = situation(14700, 8000, 8000)
    const hugo = situation(12000, 5000, 12000) // 128 € − 8 € de réduction famille
    expect(cumul([lea, hugo])).toMatchObject({ du: 26700, paye: 13000, restant: 13700, retard: 7000, statut: 'partiel' })
  })

  it('l’avance payée pour un enfant ne couvre pas le retard d’un autre', () => {
    const lea = situation(14700, 14700, 8000) // 3 chèques remis d'avance
    const hugo = situation(12000, 5000, 12000)
    expect(cumul([lea, hugo])).toMatchObject({ restant: 7000, retard: 7000, statut: 'partiel' })
    expect(cumul([lea])).toMatchObject({ statut: 'solde', retard: 0 })
  })
})

describe('répartition d’un paiement sur plusieurs dossiers', () => {
  const somme = (p: number[]) => p.reduce((s, x) => s + x, 0)

  it('au prorata du restant dû, au centime près', () => {
    const parts = repartir(10000, [14700, 12000])
    expect(somme(parts)).toBe(10000)
    expect(parts).toEqual([5506, 4494])
  })

  it('un paiement qui solde tout donne à chacun son restant', () => {
    expect(repartir(26700, [14700, 12000])).toEqual([14700, 12000])
  })

  it('l’excédent va au premier dossier', () => {
    expect(repartir(30000, [14700, 12000])).toEqual([18000, 12000])
  })

  it('un dossier déjà soldé ne reçoit rien', () => {
    expect(repartir(5000, [0, 12000])).toEqual([0, 5000])
  })

  it('rien n’est dû : parts égales, reliquat au premier', () => {
    expect(repartir(1001, [0, 0])).toEqual([501, 500])
  })

  it('montants quelconques : la somme est toujours exacte', () => {
    for (const [m, r] of [
      [1, [3, 3, 3]],
      [9999, [3333, 3333, 3334]],
      [12345, [100, 20000, 7]],
    ] as [number, number[]][])
      expect(somme(repartir(m, r))).toBe(m)
  })
})
