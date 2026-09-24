// Événements du club (specs 009, 021) — types des réponses de l'API et mises en forme partagées par
// les pages publiques et l'espace bureau. « Competition » : nom historique d'un événement (une
// compétition est un type d'événement parmi d'autres : stage, rencontre, repas, fête…).
import type { Categorie } from '../content/categories'
import { TYPES_EVENEMENT, type ModeInscription, type TypeEvenement } from '../content/evenements'
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
  type: TypeEvenement
  inscription: ModeInscription
  nom: string
  date: string
  heure: string | null
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

/** Participants d'une famille inscrite (mode « famille »). */
export type Participants = { adultes: number; enfants: number }

/** Liste du bureau : enfants inscrits, ou familles et participants. */
export type CompetitionBureau = Competition & { inscrits: number; ressaisis: number; familles: number; participants: number }

/** Mes enfants face à un événement (GET /api/famille/competitions/:id), ou ma famille (mode « famille »). */
export type MesEnfantsCompetition = {
  inscriptionsOuvertes: boolean
  famille: Participants | null
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

/** Mes enfants concernés par chaque événement à venir, ou ma famille (GET /api/famille/competitions). */
export type EnfantsConcernes = { competition_id: number; famille: Participants | null; enfants: { prenom: string; inscrit: boolean }[] }[]

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

export type FamilleInscrite = Participants & { user_id: number; nom: string; inscrit_le: string; modifie_le: string | null }

export type InscriptionsBureau = { competition: CompetitionDetail; inscrits: LigneInscrit[]; candidats: LigneInscrit[]; familles: FamilleInscrite[] }

/** Événement dans l'historique d'un enfant. */
export type CompetitionEnfant = { id: number; nom: string; date: string; statut: StatutCompetition; type?: TypeEvenement }

// --- Mises en forme ---

const jour = (iso: string) => new Date(`${iso}T12:00:00`)

/** « samedi 14 octobre 2026 ». */
export const dateLongue = (iso: string) =>
  jour(iso).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

/** « samedi 14 octobre » (sans l'année). */
const dateSansAnnee = (iso: string) => jour(iso).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })

/** Pavé de date d'une carte : « sam. », « 14 », « oct. ». */
export function paveDate(iso: string): { semaine: string; jour: string; mois: string } {
  const d = jour(iso)
  return {
    semaine: d.toLocaleDateString('fr-FR', { weekday: 'short' }),
    jour: String(d.getDate()),
    mois: d.toLocaleDateString('fr-FR', { month: 'short' }),
  }
}

/** « 14 h 30 » depuis « 14:30 » ; « 19 h » depuis « 19:00 ». */
export const heureFr = (h: string) => {
  const [hh = '', mm = ''] = h.split(':')
  return mm === '00' ? `${Number(hh)} h` : `${Number(hh)} h ${mm}`
}

/** « Compétition », « Repas »… */
export const libelleType = (t: TypeEvenement) => TYPES_EVENEMENT[t]

/** « Poussins, Benjamins · filles » — catégories dans l'ordre de la table de la saison ; aucune = tous. */
export function libelleCriteres(c: Pick<Competition, 'categories' | 'sexe'>, categories: Categorie[]): string {
  const noms = categories.filter((cat) => c.categories.includes(cat.id)).map((cat) => cat.nom)
  const sexe = c.sexe === 'F' ? ' · filles' : c.sexe === 'M' ? ' · garçons' : ''
  return `${noms.length ? noms.join(', ') : 'Tous les enfants'}${sexe}`
}

/** « 2 adultes et 3 enfants ». */
export function libelleParticipants(p: Participants): string {
  const parts = [p.adultes ? `${p.adultes} adulte${p.adultes > 1 ? 's' : ''}` : '', p.enfants ? `${p.enfants} enfant${p.enfants > 1 ? 's' : ''}` : ''].filter(Boolean)
  return parts.join(' et ') || 'personne'
}

/** État des inscriptions, pour un bandeau ou une pastille. */
export function etatInscriptions(c: CompetitionDetail): { libelle: string; ton: 'ouvert' | 'ferme' | 'annule' } {
  if (c.statut === 'annulee') return { libelle: c.type === 'competition' ? 'Compétition annulée' : 'Événement annulé', ton: 'annule' }
  if (c.inscription === 'aucune') return { libelle: 'Sans inscription', ton: 'ferme' }
  if (c.inscriptionsOuvertes) return { libelle: `Inscriptions jusqu’au ${dateSansAnnee(c.date_limite)} inclus`, ton: 'ouvert' }
  return { libelle: 'Inscriptions closes', ton: 'ferme' }
}

/** Itinéraire vers l'adresse (ou, à défaut, le lieu). */
export const lienItineraire = (c: Pick<Competition, 'adresse' | 'lieu'>) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.adresse ?? c.lieu)}`

/** Adresse publique de la page de l'événement (à partager). */
export const urlCompetition = (id: number) => `${window.location.origin}/evenements/${id}`

/** Message prêt à poster dans le groupe WhatsApp du club, selon le mode d'inscription. */
export function messageWhatsApp(c: Competition, url: string, categories: Categorie[]): string {
  const limite = dateSansAnnee(c.date_limite)
  return [
    `${c.type === 'competition' ? '🥋' : '📅'} ${c.nom} — ${dateLongue(c.date)}${c.heure ? ` à ${heureFr(c.heure)}` : ''}, ${c.lieu}`,
    ...(c.inscription === 'enfants' ? [`Pour : ${libelleCriteres(c, categories)}`, `Inscrivez vos enfants avant le ${limite} inclus :`] : []),
    ...(c.inscription === 'famille' ? [`Inscrivez votre famille (nombre de participants) avant le ${limite} inclus :`] : []),
    ...(c.inscription === 'aucune' ? ['Toutes les informations :'] : []),
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

/** Familles inscrites (mode « famille ») : nom, adultes, enfants, total — pour le traiteur, la salle… */
export function telechargerFamilles(c: Pick<Competition, 'date' | 'nom'>, familles: FamilleInscrite[]) {
  const lignes = [['Famille', 'Adultes', 'Enfants', 'Total'], ...familles.map((f) => [f.nom, String(f.adultes), String(f.enfants), String(f.adultes + f.enfants)])]
  csv.telechargerCsv(`participants-${c.date}-${csv.slug(c.nom)}.csv`, lignes)
}
