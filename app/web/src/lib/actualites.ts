// Actualités du club (spec 013) — types des réponses de l'API et mises en forme.
import type { StatutActualite, Visibilite } from '../content/actualites'

export type Actualite = {
  id: number
  titre: string
  texte: string
  visibilite: Visibilite
  statut: StatutActualite
  publiee_le: string | null
  updated_at: string
  image: boolean
}

export type ActualiteGestion = Actualite & { auteur: string | null }

/** Paragraphes du texte (séparés par une ligne vide). */
export const paragraphes = (texte: string) =>
  texte
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)

/** Début du texte, pour une carte : premier paragraphe, coupé à un mot. */
export function extrait(texte: string, longueur = 180): string {
  const premier = paragraphes(texte)[0] ?? ''
  if (premier.length <= longueur) return premier
  const coupe = premier.slice(0, longueur)
  return `${coupe.slice(0, coupe.lastIndexOf(' ') > 0 ? coupe.lastIndexOf(' ') : longueur)}…`
}

/** « 25 septembre 2026 » depuis un horodatage UTC de la base. */
export const datePublication = (utc: string) =>
  new Date(`${utc.replace(' ', 'T')}Z`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

/** Adresse de la photo (le paramètre change à chaque modification : jamais d'ancienne photo en cache). */
export const imageActualite = (a: Pick<Actualite, 'id' | 'updated_at'>, gestion = false) =>
  `/api/actualites/${gestion ? 'gestion/' : ''}${a.id}/image?v=${encodeURIComponent(a.updated_at)}`

/** Adresse publique de l'actualité (à partager). */
export const urlActualite = (id: number) => `${window.location.origin}/actualites/${id}`

/** Message prêt à poster dans le groupe WhatsApp du club. */
export const messageWhatsApp = (a: Pick<Actualite, 'titre' | 'texte'>, url: string) => [`📣 ${a.titre}`, extrait(a.texte, 200), url].filter(Boolean).join('\n')
