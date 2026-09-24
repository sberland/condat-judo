// Catégories d'âge France Judo (spec 009) — la liste vient du référentiel de la saison (spec 003),
// partagée par l'écran et le Worker (éligibilité contrôlée côté API). ⚠️ Importé par le Worker :
// pas de DOM ; compatible `noUncheckedIndexedAccess`.

/** `de` / `a` = années de naissance incluses ; `de` = 1900 pour « … et avant ». */
export type Categorie = { id: string; nom: string; de: number; a: number }

/** Catégorie d'après la date de naissance (ISO) ; null si hors de la table (trop jeune). */
export function categorieDe(categories: Categorie[], dateNaissance: string): Categorie | null {
  const annee = Number(dateNaissance.slice(0, 4))
  return categories.find((c) => annee >= c.de && annee <= c.a) ?? null
}

export const categorieParId = (categories: Categorie[], id: string) => categories.find((c) => c.id === id)

/** Libellé court : « Poussins (2017-2018) », « Seniors (2006 et avant) ». */
export const libelleCategorie = (c: Categorie) => `${c.nom} (${c.de === 1900 ? `${c.a} et avant` : `${c.de}-${c.a}`})`

export type CriteresCompetition = { categories: string[]; sexe: 'F' | 'M' | null }

/** Éligibilité d'un adhérent : catégorie retenue (aucune retenue = toutes, hors compétition, spec 021)
 * et, si l'événement l'impose, même sexe. */
export function eligible(categories: Categorie[], adherent: { date_naissance: string; sexe: 'F' | 'M' }, c: CriteresCompetition): boolean {
  const cat = categorieDe(categories, adherent.date_naissance)
  const categorieOk = c.categories.length === 0 || (!!cat && c.categories.includes(cat.id))
  return categorieOk && (c.sexe === null || c.sexe === adherent.sexe)
}
