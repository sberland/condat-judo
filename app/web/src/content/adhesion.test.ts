import { describe, expect, it } from 'vitest'
import { calculerMontant, CEINTURES, estMineur, etatDossier, formuleJudoSuggeree, FORMULES, horsCommuneSuggere, type DossierPourEtat } from './adhesion'

const sans = { passeport: false, horsCommune: false, reductionFamille: false }

describe('montant du dossier (grille 2026/2027)', () => {
  it('reprend le sous-total du formulaire pour chaque formule', () => {
    const attendus: Record<string, number> = {
      'judo-micro-mini': 12800,
      'judo-poussins-juniors': 14700,
      'judo-adulte': 12100,
      taiso: 11900,
      'yoga-1': 10300,
      'yoga-2': 16300,
    }
    for (const f of FORMULES) expect(calculerMontant({ formule: f.id, ...sans })?.total, f.id).toBe(attendus[f.id])
  })

  it('ajoute passeport (judo seulement) et hors commune, retire la réduction famille', () => {
    expect(calculerMontant({ formule: 'judo-poussins-juniors', passeport: true, horsCommune: true, reductionFamille: true })).toMatchObject({
      supplements: 1000,
      reduction: 800,
      total: 14900,
    })
    expect(calculerMontant({ formule: 'taiso', passeport: true, horsCommune: false, reductionFamille: false })?.supplements).toBe(0)
  })

  it('paiement en 3 fois : la somme des versements égale toujours le total', () => {
    for (const f of FORMULES)
      for (const passeport of [false, true])
        for (const horsCommune of [false, true])
          for (const reductionFamille of [false, true]) {
            const m = calculerMontant({ formule: f.id, passeport, horsCommune, reductionFamille })
            expect(m && m.echeancier.reduce((a, b) => a + b, 0), f.id).toBe(m?.total)
          }
  })

  it('refuse une formule inconnue', () => {
    expect(calculerMontant({ formule: 'karate', ...sans })).toBeNull()
  })
})

describe('suggestions', () => {
  it('tranche judo d’après l’année de naissance (formulaire 2026/2027)', () => {
    expect(formuleJudoSuggeree(2021)).toBe('judo-micro-mini')
    expect(formuleJudoSuggeree(2019)).toBe('judo-micro-mini')
    expect(formuleJudoSuggeree(2018)).toBe('judo-poussins-juniors')
    expect(formuleJudoSuggeree(2007)).toBe('judo-poussins-juniors')
    expect(formuleJudoSuggeree(2006)).toBe('judo-adulte')
  })

  it('hors commune d’après le code postal', () => {
    expect(horsCommuneSuggere('87920')).toBe(false)
    expect(horsCommuneSuggere('87170')).toBe(true)
    expect(horsCommuneSuggere(null)).toBe(false)
  })

  it('majorité à 18 ans révolus', () => {
    const ref = new Date('2026-09-24T12:00:00')
    expect(estMineur('2008-09-25', ref)).toBe(true)
    expect(estMineur('2008-09-24', ref)).toBe(false)
    expect(estMineur('1980-01-01', ref)).toBe(false)
  })

  it('ceintures : liste officielle ordonnée, sans doublon', () => {
    expect(CEINTURES[0]).toBe('Blanche')
    expect(CEINTURES).toContain('Verte-bleue')
    expect(new Set(CEINTURES).size).toBe(CEINTURES.length)
  })
})

describe('état du dossier', () => {
  const complet: DossierPourEtat = {
    paiement_mode: 'cheque',
    formalite_recue_le: '2026-09-10',
    soins_urgence: 'oui',
    droit_image: 'non',
    whatsapp: 'oui',
    valide_le: null,
  }

  it('complet, puis validé par le bureau', () => {
    expect(etatDossier(complet, { mineur: true, responsables: 1 })).toEqual({ statut: 'complet', manques: [], aRecueillir: [] })
    expect(etatDossier({ ...complet, valide_le: '2026-09-24 10:00:00' }, { mineur: true, responsables: 1 }).statut).toBe('valide')
  })

  it('liste ce qui manque (bloquant)', () => {
    const e = etatDossier({ ...complet, paiement_mode: null, formalite_recue_le: null }, { mineur: true, responsables: 0 })
    expect(e.statut).toBe('a_completer')
    expect(e.manques).toEqual(['responsable légal', 'mode de paiement', 'formalité médicale'])
  })

  it('les consentements non recueillis sont signalés sans bloquer', () => {
    const e = etatDossier({ ...complet, droit_image: 'non_recueilli', whatsapp: 'non_recueilli', soins_urgence: 'non_recueilli' }, { mineur: true, responsables: 1 })
    expect(e.statut).toBe('complet')
    expect(e.aRecueillir).toEqual(['soins d’urgence', 'droit à l’image', 'groupe WhatsApp'])
  })

  it('un majeur n’a besoin ni de responsable ni d’autorisation de soins', () => {
    const e = etatDossier({ ...complet, soins_urgence: 'non_recueilli' }, { mineur: false, responsables: 0 })
    expect(e).toEqual({ statut: 'complet', manques: [], aRecueillir: [] })
  })
})
