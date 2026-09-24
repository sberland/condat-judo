import { useQuery, type QueryClient } from '@tanstack/react-query'
import type { EtatDossier, Formalite, ModePaiement, Recueil } from '../content/adhesion'
import type { CompetitionEnfant } from './competitions'

export type Environnement = 'production' | 'preview' | 'local'

export type Health = { status: string; version: string; environment: Environnement }

export type Role = 'admin' | 'bureau' | 'tresorier' | 'encadrant' | 'contenu'

export const ROLES: Record<Role, { libelle: string; description: string }> = {
  admin: { libelle: 'Administrateur', description: 'Tout, y compris l’attribution des rôles' },
  bureau: { libelle: 'Bureau', description: 'Adhérents, comptes, responsables' },
  tresorier: { libelle: 'Trésorier', description: 'Suivi des licences et paiements' },
  encadrant: { libelle: 'Encadrant', description: 'Garderie, listes des cours et compétitions' },
  contenu: { libelle: 'Gestion du site', description: 'Informations du club, actualités' },
}

export type Me = {
  id: number
  prenom: string
  nom: string
  email: string | null
  telephone: string | null
  roles: Role[]
  /** app : session ouverte par un lien de connexion ; dev : utilisateur simulé (local). */
  provider: 'app' | 'dev'
}

/** Résultat d'appel qui distingue « non connecté » / « compte non reconnu » d'une erreur. */
export type MeResult = { etat: 'ok'; me: Me } | { etat: 'anonyme' } | { etat: 'inconnu' }

/** Erreur renvoyée par l'API : message général + messages par champ (formulaires) + corps brut. */
export class ErreurApi extends Error {
  constructor(
    readonly statut: number,
    message: string,
    readonly erreurs: Record<string, string> = {},
    readonly corps: Record<string, unknown> = {},
  ) {
    super(message)
  }
}

/** Appel de l'API. Toute écriture porte l'en-tête anti-CSRF exigé par le Worker. */
export async function appel<T>(methode: 'GET' | 'POST' | 'PUT' | 'DELETE', url: string, corps?: unknown): Promise<T> {
  const r = await fetch(url, {
    method: methode,
    credentials: 'same-origin',
    headers: {
      'X-Condat-Judo': '1',
      ...(corps !== undefined ? { 'Content-Type': 'application/json' } : {}),
    },
    body: corps !== undefined ? JSON.stringify(corps) : undefined,
  })
  const data = (await r.json().catch(() => ({}))) as { error?: string; erreurs?: Record<string, string> }
  if (!r.ok) throw new ErreurApi(r.status, data.error ?? 'Une erreur est survenue', data.erreurs ?? {}, data)
  return data as T
}

export function useHealth() {
  return useQuery<Health>({
    queryKey: ['health'],
    queryFn: async () => {
      const r = await fetch('/api/health')
      if (!r.ok) throw new Error(`API indisponible (${r.status})`)
      return (await r.json()) as Health
    },
    staleTime: Infinity,
  })
}

// Utilisateur connecté résolu par le Worker (seam d'identité) : authentification applicative en ligne (à venir),
// utilisateur simulé (DEV_SUBJECT) en dev local via le proxy Vite.
export function useMe() {
  return useQuery<MeResult>({
    queryKey: ['me'],
    queryFn: async () => {
      const r = await fetch('/api/me', { credentials: 'same-origin' })
      if (r.status === 401) return { etat: 'anonyme' }
      if (r.status === 403) return { etat: 'inconnu' }
      if (!r.ok) throw new Error(`API indisponible (${r.status})`)
      return { etat: 'ok', me: (await r.json()) as Me }
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  })
}

export const aUnRole = (me: Me, ...roles: Role[]) => me.roles.some((r) => roles.includes(r))

// --- Types de l'espace connecté (spec 004) ---

export type Qualite = 'mere' | 'pere' | 'tuteur' | 'autre'
export const QUALITES: Record<Qualite, string> = { mere: 'Mère', pere: 'Père', tuteur: 'Tuteur / tutrice', autre: 'Autre' }

export type AdherentListe = {
  id: number
  prenom: string
  nom: string
  date_naissance: string
  sexe: 'F' | 'M'
  grade: string | null
  ville: string | null
  supprime_le: string | null
  responsables: { id: number; prenom: string; nom: string }[]
}

export type Adherent = {
  id: number
  prenom: string
  nom: string
  date_naissance: string
  sexe: 'F' | 'M'
  grade: string | null
  numero_licence: string | null
  adresse: string | null
  code_postal: string | null
  ville: string | null
  supprime_le: string | null
}

export type Responsable = {
  id: number
  prenom: string
  nom: string
  email: string | null
  telephone: string | null
  qualite: Qualite
  peut_inscrire: number
  peut_recuperer: number
  est_contact: number
  compte_active: number
}

export type PersonneAutorisee = { id: number; prenom: string; nom: string; lien: string; telephone: string | null }

export type FicheAdherent = {
  adherent: Adherent
  responsables: Responsable[]
  personnesAutorisees: PersonneAutorisee[]
  competitions: CompetitionEnfant[]
}

export type Compte = {
  id: number
  prenom: string
  nom: string
  email: string | null
  telephone: string | null
  last_login: string | null
  roles: Role[]
  compte_active: boolean
  enfants: number
  /** Sessions ouvertes (appareils connectés). */
  sessions: number
}

export type Enfant = {
  id: number
  prenom: string
  nom: string
  date_naissance: string
  sexe: 'F' | 'M'
  grade: string | null
  numero_licence: string | null
  qualite: Qualite
  peut_inscrire: number
  peut_recuperer: number
  est_contact: number
  coResponsables: { prenom: string; nom: string; qualite: Qualite }[]
  personnesAutorisees: { prenom: string; nom: string; lien: string }[]
  competitions: CompetitionEnfant[]
}

// --- Dossiers d'adhésion (spec 010a) ---

export type Adhesion = {
  formule: string
  passeport: 0 | 1
  hors_commune: 0 | 1
  reduction_famille: 0 | 1
  montant_participation: number
  montant_licence: number
  montant_supplements: number
  montant_reduction: number
  montant_total: number
  paiement_mode: ModePaiement | null
  paiement_3_fois: 0 | 1
  echeance_1: number
  echeance_2: number
  echeance_3: number
  formalite_type: Formalite | null
  formalite_recue_le: string | null
  soins_urgence: Recueil
  soins_urgence_le: string | null
  droit_image: Recueil
  droit_image_le: string | null
  whatsapp: Recueil
  whatsapp_le: string | null
  valide_le: string | null
}

export type ContexteDossier = {
  mineur: boolean
  responsables: number
  /** Autres enfants d'un même responsable qui ont déjà un dossier cette saison. */
  autresDossiersFamille: number
  horsCommune: boolean
  formuleJudo: string
}

export type DossierAdhesion = {
  saison: { id: string; libelle: string }
  contexte: ContexteDossier
  adhesion: Adhesion | null
  etat: EtatDossier | null
}

export type ListeDossiers = {
  saison: { id: string; libelle: string }
  lignes: {
    adherent: { id: number; prenom: string; nom: string; date_naissance: string }
    dossier: { formule: string; montant_total: number } | null
    etat: EtatDossier | null
  }[]
}

// --- Connexion (spec 005a) ---

/** Lien de connexion : le jeton voyage dans le fragment (#), jamais envoyé au serveur par un aperçu. */
export const urlConnexion = (jeton: string) => `${window.location.origin}/connexion#${jeton}`

/** Lien « Envoyer sur WhatsApp » : vers le numéro du compte s'il est connu (06… → 336…). */
export function urlWhatsApp(message: string, telephone: string | null): string {
  const chiffres = (telephone ?? '').replace(/\D/g, '')
  const numero = /^0\d{9}$/.test(chiffres) ? `33${chiffres.slice(1)}` : ''
  return `https://wa.me/${numero}?text=${encodeURIComponent(message)}`
}

/**
 * Changement d'utilisateur (connexion, déconnexion) : oublie les données personnelles chargées
 * (appareil éventuellement partagé) puis relit /me. `resetQueries` garde les composants affichés
 * (en-tête, pied de page) branchés sur la même requête : ils se mettent à jour sans rechargement.
 */
export async function changerUtilisateur(client: QueryClient): Promise<void> {
  client.removeQueries({ predicate: (q) => !['me', 'health'].includes(String(q.queryKey[0])) })
  await client.resetQueries({ queryKey: ['me'] })
}

export async function seDeconnecter(client: QueryClient): Promise<void> {
  await appel('POST', '/api/auth/deconnexion')
  await changerUtilisateur(client)
}

// --- Formatage ---

/** Date UTC de la base ('AAAA-MM-JJ HH:MM:SS') → « 1 octobre à 10:37 » (heure locale). */
export function dateHeureFr(utc: string): string {
  const d = new Date(`${utc.replace(' ', 'T')}Z`)
  return `${d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} à ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
}

export function dateFr(iso: string): string {
  const [a, m, j] = iso.split('-')
  return `${j}/${m}/${a}`
}

export function age(iso: string, aujourdhui = new Date()): number {
  const n = new Date(`${iso}T00:00:00`)
  let ans = aujourdhui.getFullYear() - n.getFullYear()
  if (aujourdhui.getMonth() < n.getMonth() || (aujourdhui.getMonth() === n.getMonth() && aujourdhui.getDate() < n.getDate())) ans--
  return ans
}
