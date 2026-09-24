// Compétitions (spec 009) — types des réponses de l'API et mises en forme partagées par les pages
// publiques et l'espace bureau.
import { CATEGORIES } from '../content/categories'
import { dateFr } from './api'
import * as csv from './csv'

export type StatutCompetition = 'ouverte' | 'cloturee' | 'annulee'

export const LIBELLES_STATUT_COMPETITION: Record<StatutCompetition, string> = {
  ouverte: 'Ouverte',
  cloturee: 'Clôturée',
  annulee: 'Annulée',
}

export type Competition = {
  id: number
  nom: string
  date: string
  lieu: string
  adresse: string | null
  lien_officiel: string | null
  infos: string | null
  categories: string[]
  sexe: 'F' | 'M' | null
  date_limite: string
  statut: StatutCompetition
}

export type CompetitionDetail = Competition & { inscriptionsOuvertes: boolean }

/** Liste du bureau : compteurs d'inscrits. */
export type CompetitionBureau = Competition & { inscrits: number; ressaisis: number }

/** Mes enfants face à une compétition (GET /api/famille/competitions/:id). */
export type MesEnfantsCompetition = {
  inscriptionsOuvertes: boolean
  enfants: {
    id: number
    prenom: string
    nom: string
    categorie: string | null
    eligible: boolean
    peutInscrire: boolean
    inscrit: boolean
  }[]
}

/** Mes enfants concernés par chaque compétition à venir (GET /api/famille/competitions). */
export type EnfantsConcernes = { competition_id: number; enfants: { prenom: string; inscrit: boolean }[] }[]

export type LigneInscrit = {
  id: number
  prenom: string
  nom: string
  date_naissance: string
  sexe: 'F' | 'M'
  categorie: string | null
  grade: string | null
  numero_licence: string | null
  inscrit_le: string | null
  inscrit_par: string | null
  ressaisi_le: string | null
  alertes: string[]
}

export type InscriptionsBureau = { competition: CompetitionDetail; inscrits: LigneInscrit[]; candidats: LigneInscrit[] }

/** Compétition dans l'historique d'un enfant. */
export type CompetitionEnfant = { id: number; nom: string; date: string; statut: StatutCompetition }

// --- Mises en forme ---

const jour = (iso: string) => new Date(`${iso}T12:00:00`)

/** « samedi 14 octobre 2026 ». */
export const dateLongue = (iso: string) =>
  jour(iso).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

/** Pavé de date d'une carte : « sam. », « 14 », « oct. ». */
export function paveDate(iso: string): { semaine: string; jour: string; mois: string } {
  const d = jour(iso)
  return {
    semaine: d.toLocaleDateString('fr-FR', { weekday: 'short' }),
    jour: String(d.getDate()),
    mois: d.toLocaleDateString('fr-FR', { month: 'short' }),
  }
}

/** « Poussins, Benjamins · filles » — catégories dans l'ordre de la table officielle. */
export function libelleCriteres(c: Pick<Competition, 'categories' | 'sexe'>): string {
  const noms = CATEGORIES.filter((cat) => c.categories.includes(cat.id)).map((cat) => cat.nom)
  const sexe = c.sexe === 'F' ? ' · filles' : c.sexe === 'M' ? ' · garçons' : ''
  return `${noms.join(', ')}${sexe}`
}

/** État des inscriptions, pour un bandeau ou une pastille. */
export function etatInscriptions(c: CompetitionDetail): { libelle: string; ton: 'ouvert' | 'ferme' | 'annule' } {
  if (c.statut === 'annulee') return { libelle: 'Compétition annulée', ton: 'annule' }
  if (c.inscriptionsOuvertes) return { libelle: `Inscriptions jusqu’au ${dateLongue(c.date_limite).replace(/ \d{4}$/, '')} inclus`, ton: 'ouvert' }
  return { libelle: 'Inscriptions closes', ton: 'ferme' }
}

/** Itinéraire vers l'adresse (ou, à défaut, le lieu). */
export const lienItineraire = (c: Pick<Competition, 'adresse' | 'lieu'>) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.adresse ?? c.lieu)}`

/** Adresse publique de la page de la compétition (à partager). */
export const urlCompetition = (id: number) => `${window.location.origin}/competitions/${id}`

/** Message prêt à poster dans le groupe WhatsApp du club. */
export function messageWhatsApp(c: Competition, url: string): string {
  return [
    `🥋 ${c.nom} — ${dateLongue(c.date)}, ${c.lieu}`,
    `Pour : ${libelleCriteres(c)}`,
    `Inscrivez vos enfants avant le ${dateLongue(c.date_limite).replace(/ \d{4}$/, '')} inclus :`,
    url,
  ].join('\n')
}

// --- Liste des inscrits, pour la ressaisie sur le site fédéral ---

const COLONNES: [string, (l: LigneInscrit) => string][] = [
  ['Nom', (l) => l.nom],
  ['Prénom', (l) => l.prenom],
  ['Date de naissance', (l) => dateFr(l.date_naissance)],
  ['Sexe', (l) => l.sexe],
  ['Catégorie', (l) => l.categorie ?? ''],
  ['Ceinture', (l) => l.grade ?? ''],
  ['N° de licence', (l) => l.numero_licence ?? ''],
]

const tableau = (lignes: LigneInscrit[]) => [COLONNES.map(([t]) => t), ...lignes.map((l) => COLONNES.map(([, v]) => v(l)))]

/** Texte à coller dans un tableur (colonnes séparées par des tabulations). */
export const versTexte = (lignes: LigneInscrit[]) => csv.versTexte(tableau(lignes))

/** CSV « à la française » (séparateur ;). */
export const versCsv = (lignes: LigneInscrit[]) => csv.versCsv(tableau(lignes))

/** « inscrits-2026-10-14-tournoi-de-l-exemple.csv ». */
export const nomFichierCsv = (c: Pick<Competition, 'date' | 'nom'>) => `inscrits-${c.date}-${csv.slug(c.nom)}.csv`

export const telechargerCsv = (c: Pick<Competition, 'date' | 'nom'>, lignes: LigneInscrit[]) => csv.telechargerCsv(nomFichierCsv(c), tableau(lignes))
