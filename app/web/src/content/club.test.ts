import { describe, expect, it } from 'vitest'
import indexHtml from '../../index.html?raw'
import { DISCIPLINES_PUBLIQUES, enLettres, enumerer, LISTE_DISCIPLINES } from './club'
import { REFERENTIEL_2026_2027 } from './referentiel-initial'
import { euros, totalFormule } from '../lib/tarifs'

describe('disciplines : énumérations déduites de la liste', () => {
  it('énumère à la française', () => {
    expect(enumerer([])).toBe('')
    expect(enumerer(['judo'])).toBe('judo')
    expect(enumerer(['judo', 'yoga'])).toBe('judo et yoga')
    expect(enumerer(['judo', 'jujitsu', 'taïso', 'yoga'])).toBe('judo, jujitsu, taïso et yoga')
  })

  it('écrit le nombre en lettres', () => {
    expect(enLettres(3)).toBe('Trois')
    expect(enLettres(4)).toBe('Quatre')
    expect(enLettres(42)).toBe('42')
  })

  it('cite toutes les disciplines publiques, yoga compris', () => {
    expect(LISTE_DISCIPLINES).toBe('judo, jujitsu, taïso et yoga')
  })

  // index.html est lu avant le JavaScript (moteurs de recherche, aperçus de liens WhatsApp) :
  // son titre et ses descriptions doivent suivre la liste des disciplines.
  it('index.html cite chaque discipline dans le titre et les descriptions', () => {
    const balises = {
      title: indexHtml.match(/<title>([^<]*)<\/title>/)?.[1],
      description: indexHtml.match(/name="description"\s+content="([^"]*)"/)?.[1],
      'og:description': indexHtml.match(/property="og:description" content="([^"]*)"/)?.[1],
    }
    for (const [balise, texte] of Object.entries(balises)) {
      expect(texte, balise).toBeTruthy()
      for (const d of DISCIPLINES_PUBLIQUES) expect(texte?.toLowerCase(), `${balise} : ${d.nom}`).toContain(d.nom.toLowerCase())
    }
  })
})

const formules = REFERENTIEL_2026_2027.tarifs.groupes.flatMap((g) => g.formules)

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
