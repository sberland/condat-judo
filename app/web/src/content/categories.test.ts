import { describe, expect, it } from 'vitest'
import { categorieDe, CATEGORIES, eligible, libelleCategorie } from './categories'

describe('catégories d’âge 2026/2027', () => {
  it('couvrent chaque année de naissance de 1900 à 2022 sans trou ni chevauchement', () => {
    for (let annee = 1900; annee <= 2022; annee++) {
      const trouvees = CATEGORIES.filter((c) => annee >= c.de && annee <= c.a)
      expect(trouvees.length, String(annee)).toBe(1)
    }
  })

  it('placent chaque enfant dans la bonne catégorie', () => {
    expect(categorieDe('2021-06-01')?.id).toBe('micro-poussins')
    expect(categorieDe('2019-12-31')?.id).toBe('mini-poussins')
    expect(categorieDe('2017-01-01')?.id).toBe('poussins')
    expect(categorieDe('2014-03-12')?.id).toBe('minimes')
    expect(categorieDe('2010-05-05')?.id).toBe('cadets')
    expect(categorieDe('2007-09-01')?.id).toBe('juniors')
    expect(categorieDe('1980-01-01')?.id).toBe('seniors')
    expect(categorieDe('2023-01-01')).toBeNull()
  })

  it('concordent avec la grille tarifaire du club (micro / mini-poussins 2019-2022, poussins à juniors 2007-2018)', () => {
    for (let annee = 2019; annee <= 2022; annee++) expect(['micro-poussins', 'mini-poussins']).toContain(categorieDe(`${annee}-06-15`)?.id)
    for (let annee = 2007; annee <= 2018; annee++) expect(['poussins', 'benjamins', 'minimes', 'cadets', 'juniors']).toContain(categorieDe(`${annee}-06-15`)?.id)
  })

  it('libellés', () => {
    expect(libelleCategorie(CATEGORIES[2]!)).toBe('Poussins (2017-2018)')
    expect(libelleCategorie(CATEGORIES[7]!)).toBe('Seniors (2006 et avant)')
  })
})

describe('éligibilité à une compétition', () => {
  const lea = { date_naissance: '2017-03-12', sexe: 'F' as const }
  it('selon la catégorie', () => {
    expect(eligible(lea, { categories: ['poussins', 'benjamins'], sexe: null })).toBe(true)
    expect(eligible(lea, { categories: ['minimes'], sexe: null })).toBe(false)
  })
  it('selon le sexe si la compétition l’impose', () => {
    expect(eligible(lea, { categories: ['poussins'], sexe: 'F' })).toBe(true)
    expect(eligible(lea, { categories: ['poussins'], sexe: 'M' })).toBe(false)
  })
})
