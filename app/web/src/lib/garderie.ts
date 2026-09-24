// Garderie du mercredi (spec 012a) — types des réponses de l'API et mises en forme des dates.

export type GarderieFamille = {
  saison: { id: string; libelle: string }
  garderie: { lieux: string[]; limite: string; ouverte: boolean; provisoire: boolean; fin: string }
  mercredis: { date: string; modifiable: boolean }[]
  enfants: { id: number; prenom: string; nom: string; peutInscrire: boolean; demandes: { date: string; lieu: string }[] }[]
}

export type GarderieBureau = {
  date: string
  lieux: string[]
  mercredis: string[]
  ouvert: boolean
  demandes: { adherent_id: number; prenom: string; nom: string; date_naissance: string; lieu: string; demande_le: string; demande_par: string | null }[]
}

const jour = (iso: string) => new Date(`${iso}T12:00:00`)

/** « mercredi 30 septembre ». */
export const jourLong = (iso: string) => jour(iso).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })

/** « 30 sept. ». */
export const jourCourt = (iso: string) => jour(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })

/** « septembre 2026 » (regroupement par mois). */
export const moisDe = (iso: string) => jour(iso).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })

/** Première lettre en majuscule (« Mercredi 30 septembre ») ; la classe CSS `capitalize` toucherait chaque mot. */
export const majuscule = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

/** Liste du mercredi de l'encadrant (spec 012b). `enfants` : null hors d'un mercredi. */
export type GarderieJour = {
  date: string
  aujourdhui: string
  /** Hors production : un mercredi peut être choisi pour les essais. */
  essais: boolean
  mercredis: string[]
  prochain: string | null
  lieux: string[]
  enfants: EnfantDuJour[] | null
}

export type EnfantDuJour = {
  id: number
  prenom: string
  nom: string
  categorie: string | null
  lieu: string
  photo: boolean
  responsables: { prenom: string; nom: string; qualite: string; telephone: string | null; peutRecuperer: boolean; estContact: boolean }[]
  personnes: { prenom: string; nom: string; lien: string; telephone: string | null }[]
}
