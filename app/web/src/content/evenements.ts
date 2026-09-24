// Événements du club (spec 021) — partagé par l'écran et le Worker (pas de DOM). Une compétition
// (spec 009) est un événement parmi d'autres : stage, rencontre, repas, fête…

export const TYPES_EVENEMENT = {
  competition: 'Compétition',
  stage: 'Stage',
  rencontre: 'Rencontre',
  repas: 'Repas',
  fete: 'Fête du club',
  autre: 'Événement',
} as const

export type TypeEvenement = keyof typeof TYPES_EVENEMENT

/** Inscription au choix du bureau ; une compétition inscrit toujours des enfants. */
export const MODES_INSCRIPTION = {
  aucune: 'Pas d’inscription (information seule)',
  enfants: 'Inscription des enfants',
  famille: 'Inscription de la famille (nombre de participants)',
} as const

export type ModeInscription = keyof typeof MODES_INSCRIPTION

/** Participants d'une famille inscrite (mode « famille »). */
export const MAX_PARTICIPANTS = 20
