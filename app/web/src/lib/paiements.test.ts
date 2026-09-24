import { describe, expect, it } from 'vitest'
import { lireEuros, saisieEuros, tableauFamilles, tableauPaiements, type Paiement } from './paiements'

describe('saisie des montants', () => {
  it('lit les écritures courantes', () => {
    expect(lireEuros('147')).toBe(14700)
    expect(lireEuros('147,5')).toBe(14750)
    expect(lireEuros(' 147.50 € ')).toBe(14750)
    expect(lireEuros('1 234,56')).toBe(123456)
  })

  it('refuse l’illisible et le nul', () => {
    for (const s of ['', 'abc', '12,345', '-5', '0', '0,00']) expect(lireEuros(s), s).toBe(null)
  })

  it('réécrit un montant pour un champ', () => {
    expect(saisieEuros(13000)).toBe('130')
    expect(saisieEuros(12345)).toBe('123,45')
    expect(saisieEuros(12340)).toBe('123,40')
  })
})

describe('exports comptables', () => {
  const cheque: Paiement = {
    id: 1,
    montant: 13000,
    mode: 'cheque',
    reference: 'Chèque n° 0000001',
    recu_le: '2026-09-10',
    encaisser_le: null,
    encaisse_le: '2026-10-05',
    parts: [
      { adhesion_id: 1, prenom: 'Léa', nom: 'Dev', montant: 8000 },
      { adhesion_id: 3, prenom: 'Hugo', nom: 'Dev', montant: 5000 },
    ],
  }

  it('une ligne par paiement, répartition détaillée', () => {
    expect(tableauPaiements([cheque])[1]).toEqual(['10/09/2026', 'Léa Dev (80,00), Hugo Dev (50,00)', 'Chèque', 'Chèque n° 0000001', '130,00', '', '05/10/2026'])
  })

  it('une ligne par famille', () => {
    const famille = { id: 1, libelle: 'Dev', membres: [{ adhesion_id: 1, prenom: 'Léa', nom: 'Dev' }], du: 26700, paye: 19700, restant: 7000, tropPercu: 0, retard: 7000, statut: 'partiel' as const }
    expect(tableauFamilles([famille])[1]).toEqual(['Dev', 'Léa', '267,00', '197,00', '70,00', '70,00'])
  })
})
