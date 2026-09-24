import { describe, expect, it } from 'vitest'
import { calculerMontant, formuleJudoSuggeree } from './adhesion'
import { categorieDe } from './categories'
import { copierReferentiel, coursTries, heure, libelleSaison, saisonDe, saisonSuivante, validerReferentiel, type Referentiel } from './referentiel'
import { REFERENTIEL_2026_2027 } from './referentiel-initial'

const R = REFERENTIEL_2026_2027
const copie = (): Referentiel => JSON.parse(JSON.stringify(R)) as Referentiel

describe('saisons', () => {
  it('une saison va de septembre à août', () => {
    expect(saisonDe('2026-09-01')).toBe('2026-2027')
    expect(saisonDe('2027-08-31')).toBe('2026-2027')
    expect(saisonDe('2027-09-01')).toBe('2027-2028')
    expect(libelleSaison('2026-2027')).toBe('2026/2027')
    expect(saisonSuivante('2026-2027')).toEqual({ id: '2027-2028', libelle: '2027/2028', debut: '2027-09-01', fin: '2028-08-31' })
  })
})

describe('référentiel 2026/2027 (état initial)', () => {
  it('est valide', () => {
    expect(validerReferentiel(R)).toEqual({ ok: true, valeur: R })
  })
})

describe('copie vers la saison suivante', () => {
  const suivant = copierReferentiel(R)

  it('décale années de naissance et dates d’un an, garde « … et avant »', () => {
    expect(suivant.categories.find((c) => c.id === 'poussins')).toMatchObject({ de: 2018, a: 2019 })
    expect(suivant.categories.find((c) => c.id === 'seniors')).toMatchObject({ de: 1900, a: 2007 })
    expect(suivant.echeances3Fois.dates).toEqual(['2028-01-05', '2028-04-05'])
    expect(suivant.tarifs.groupes[0]?.formules[0]?.annees).toEqual({ de: 2020, a: 2023 })
  })

  it('la catégorie d’un enfant change avec la saison', () => {
    expect(categorieDe(R.categories, '2017-03-12')?.id).toBe('poussins')
    expect(categorieDe(suivant.categories, '2017-03-12')?.id).toBe('benjamins')
    expect(categorieDe(suivant.categories, '2023-05-01')?.id).toBe('micro-poussins')
  })

  it('la formule judo suggérée suit aussi', () => {
    expect(formuleJudoSuggeree(R.tarifs, 2007)).toBe('judo-poussins-juniors')
    expect(formuleJudoSuggeree(suivant.tarifs, 2007)).toBe('judo-adulte')
    expect(formuleJudoSuggeree(R.tarifs, 2024)).toBe('judo-micro-mini')
  })

  it('ne modifie pas l’original, reste valide', () => {
    expect(R.categories[0]).toMatchObject({ de: 2021, a: 2022 })
    expect(validerReferentiel(suivant).ok).toBe(true)
  })

  it('les montants se calculent avec la grille de la saison', () => {
    const t = copierReferentiel(R).tarifs
    t.passeport.montant = 1000
    expect(calculerMontant(t, { formule: 'judo-poussins-juniors', passeport: true, horsCommune: false, reductionFamille: false })?.supplements).toBe(1000)
    expect(calculerMontant(R.tarifs, { formule: 'judo-poussins-juniors', passeport: true, horsCommune: false, reductionFamille: false })?.supplements).toBe(800)
  })
})

describe('validation d’un référentiel saisi', () => {
  it('catégories : identifiant, années, chevauchement', () => {
    const r = copie()
    r.categories[0]!.id = 'Micro Poussins'
    r.categories[1]!.de = 2022 // chevauche micro-poussins (2021-2022)
    const v = validerReferentiel(r)
    expect(v.ok).toBe(false)
    expect(!v.ok && Object.values(v.erreurs)).toEqual(expect.arrayContaining(['Identifiant de catégorie invalide']))
    expect(!v.ok && v.erreurs.categories).toMatch(/se chevauchent/)
  })

  it('formules : l’échéancier doit totaliser participation + licence', () => {
    const r = copie()
    r.tarifs.groupes[0]!.formules[0]!.participation = 9000
    const v = validerReferentiel(r)
    expect(!v.ok && v.erreurs['tarifs.groupes.0.formules.0']).toBe('Les trois versements doivent totaliser participation + licence')
  })

  it('formules : identifiants uniques, montants positifs', () => {
    const r = copie()
    r.tarifs.groupes[1]!.formules[0]!.id = 'judo-adulte'
    r.tarifs.passeport.montant = -5
    const v = validerReferentiel(r)
    expect(!v.ok && v.erreurs.tarifs).toBe('Deux formules ont le même identifiant')
    expect(!v.ok && v.erreurs['tarifs.passeport']).toBe('Montant invalide')
  })

  it('échéances et horaires', () => {
    const r = copie()
    r.echeances3Fois.dates = ['2027-04-05', '2027-01-05']
    r.horaires.cours[0]!.fin = '17:00'
    r.horaires.cours[1]!.jour = 'dimanchee' as never
    const v = validerReferentiel(r)
    expect(!v.ok && v.erreurs.echeances3Fois).toBe('La 2e échéance doit précéder la 3e')
    expect(!v.ok && v.erreurs['horaires.cours.0']).toBe('Le cours doit finir après son début')
    expect(!v.ok && v.erreurs['horaires.cours.1']).toBe('Jour invalide')
  })

  it('rejette une entrée vide sans planter', () => {
    const v = validerReferentiel(null)
    expect(v.ok).toBe(false)
  })
})

describe('affichage des horaires', () => {
  it('heures à la française, cours triés par jour puis heure', () => {
    expect(heure('18:30')).toBe('18 h 30')
    expect(heure('09:00')).toBe('9 h')
    expect(coursTries(R.horaires.cours).map((c) => `${c.jour} ${c.debut}`).slice(0, 3)).toEqual(['lundi 18:30', 'mardi 19:00', 'mercredi 16:00'])
  })
})
