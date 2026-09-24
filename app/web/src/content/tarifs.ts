// Grille tarifaire d'une saison (spec 003 : elle vit dans le référentiel de la saison, en base) —
// types partagés avec le Worker (calcul de référence des dossiers d'adhésion, spec 010a) : pas de
// DOM, pas de React ici. Montants en CENTIMES (calculs exacts) ; affichage via lib/tarifs.ts.

export type Formule = {
  id: string
  nom: string
  public: string
  participation: number
  licence: number
  /** Paiement en 3 fois : 1er versement (licence + part de l'activité), 2e, 3e. */
  echeancier: [number, number, number]
  /** Formule de judo : passeport possible. */
  judo: boolean
  /** Années de naissance couvertes (suggestion de la formule judo) ; null si sans objet. */
  annees: { de: number; a: number } | null
}

export type GroupeTarifs = { titre: string; formules: Formule[] }

/** Supplément ou réduction : montant (centimes) et précision affichée au public. */
export type Ajustement = { montant: number; precision: string }

export type Tarifs = {
  /** Grille à confirmer : masquée en production (page publique). */
  provisoire: boolean
  groupes: GroupeTarifs[]
  passeport: Ajustement
  horsCommune: Ajustement
  reductionFamille: Ajustement
  modesPaiement: string[]
}

export const formulesDe = (t: Tarifs): Formule[] => t.groupes.flatMap((g) => g.formules)
