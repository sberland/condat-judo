// Actualités du club (spec 013) — partagé par l'écran et le Worker (pas de DOM).

export const VISIBILITES = { public: 'Publique', familles: 'Réservée aux familles (connectées)' } as const
export type Visibilite = keyof typeof VISIBILITES

export type StatutActualite = 'brouillon' | 'publiee'

/** Photo d'une actualité : réduite dans le navigateur, 300 Ko au plus ; stockée en morceaux pour
 * que chaque ligne tienne dans une instruction de l'export D1 (100 Ko au plus). */
export const TAILLE_MAX_IMAGE_ACTUALITE = 300 * 1024

/** Taille d'un morceau de l'image en base64 (caractères). */
export const TAILLE_MORCEAU_IMAGE = 60_000
export const COTE_MAX_IMAGE_ACTUALITE = 1200

export const MAX_TITRE_ACTUALITE = 140
export const MAX_TEXTE_ACTUALITE = 5000
