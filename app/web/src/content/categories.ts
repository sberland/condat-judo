// Catégories d'âge France Judo de la saison (spec 009) — partagées par l'écran et le Worker
// (éligibilité contrôlée côté API). ⚠️ Importé par le Worker : pas de DOM ; compatible
// `noUncheckedIndexedAccess`. Termes du formulaire du club ; années de naissance vérifiées sur
// les tableaux 2026/2027 des clubs affiliés. En base avec la spec 003 (saison 2027/2028).

export type Categorie = { id: string; nom: string; de: number; a: number }

/** Du plus jeune au plus âgé ; `de` / `a` = années de naissance incluses. */
export const CATEGORIES: Categorie[] = [
  { id: 'micro-poussins', nom: 'Micro-poussins', de: 2021, a: 2022 },
  { id: 'mini-poussins', nom: 'Mini-poussins', de: 2019, a: 2020 },
  { id: 'poussins', nom: 'Poussins', de: 2017, a: 2018 },
  { id: 'benjamins', nom: 'Benjamins', de: 2015, a: 2016 },
  { id: 'minimes', nom: 'Minimes', de: 2013, a: 2014 },
  { id: 'cadets', nom: 'Cadets', de: 2010, a: 2012 },
  { id: 'juniors', nom: 'Juniors', de: 2007, a: 2009 },
  { id: 'seniors', nom: 'Seniors', de: 1900, a: 2006 },
]

export const SAISON_CATEGORIES = '2026/2027'

/** Catégorie d'après la date de naissance (ISO) ; null si trop jeune pour la saison. */
export function categorieDe(dateNaissance: string): Categorie | null {
  const annee = Number(dateNaissance.slice(0, 4))
  return CATEGORIES.find((c) => annee >= c.de && annee <= c.a) ?? null
}

export const categorieParId = (id: string) => CATEGORIES.find((c) => c.id === id)

/** Libellé court : « Poussins (2017-2018) », « Seniors (2006 et avant) ». */
export const libelleCategorie = (c: Categorie) => `${c.nom} (${c.de === 1900 ? `${c.a} et avant` : `${c.de}-${c.a}`})`

export type CriteresCompetition = { categories: string[]; sexe: 'F' | 'M' | null }

/** Éligibilité d'un adhérent : catégorie retenue et, si la compétition l'impose, même sexe. */
export function eligible(adherent: { date_naissance: string; sexe: 'F' | 'M' }, c: CriteresCompetition): boolean {
  const cat = categorieDe(adherent.date_naissance)
  return !!cat && c.categories.includes(cat.id) && (c.sexe === null || c.sexe === adherent.sexe)
}
