// Photo d'identification d'un enfant pour la garderie du mercredi (spec 012b) — règles partagées
// par l'écran (réduction avant l'envoi) et le Worker (contrôle). ⚠️ Importé par le Worker : pas
// de DOM.

export const TYPES_PHOTO = ['image/jpeg', 'image/webp'] as const
export type TypePhoto = (typeof TYPES_PHOTO)[number]

/** Poids maximal après réduction (octets) : une ligne tient dans une instruction de l'export D1. */
export const TAILLE_MAX_PHOTO = 60 * 1024

/** Plus grand côté de la photo réduite, en pixels : assez pour reconnaître un enfant. */
export const COTE_MAX_PHOTO = 480

/** Une photo est effacée un an après son dépôt : dernier jour où elle est montrée (AAAA-MM-JJ). */
export function finValiditePhoto(deposeeLe: string): string {
  const [annee = 0, mois = 1, jour = 1] = deposeeLe.slice(0, 10).split('-').map(Number)
  const fin = new Date(Date.UTC(annee + 1, mois - 1, jour))
  return fin.toISOString().slice(0, 10)
}
