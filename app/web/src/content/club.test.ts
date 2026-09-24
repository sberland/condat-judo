import { describe, expect, it } from 'vitest'
import { TARIFS } from './club'
import { euros, totalFormule } from '../lib/tarifs'

const formules = TARIFS.groupes.flatMap((g) => g.formules)

describe('grille tarifaire (formulaire d’inscription du club)', () => {
  it('reprend les sous-totaux du formulaire', () => {
    const attendus: Record<string, number> = {
      'judo-micro-mini': 12800,
      'judo-poussins-juniors': 14700,
      'judo-adulte': 12100,
      taiso: 11900,
      'yoga-1': 10300,
      'yoga-2': 16300,
    }
    for (const f of formules) expect(totalFormule(f), f.id).toBe(attendus[f.id])
  })

  it('paiement en 3 fois : la somme des versements égale le total', () => {
    for (const f of formules) expect(f.echeancier.reduce((a, b) => a + b, 0), f.id).toBe(totalFormule(f))
  })

  it('paiement en 3 fois : le 1er versement comprend la licence', () => {
    for (const f of formules) expect(f.echeancier[0], f.id).toBeGreaterThanOrEqual(f.licence)
  })

  it('identifiants de formule uniques', () => {
    expect(new Set(formules.map((f) => f.id)).size).toBe(formules.length)
  })
})

describe('euros', () => {
  it('affiche les montants ronds sans centimes et les autres à la française', () => {
    expect(euros(12800)).toBe('128 €')
    expect(euros(7520)).toBe('75,20 €')
    expect(euros(4380)).toBe('43,80 €')
  })
})
