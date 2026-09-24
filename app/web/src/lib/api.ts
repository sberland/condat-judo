import { useQuery } from '@tanstack/react-query'

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
  provider: string
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

export type FicheAdherent = { adherent: Adherent; responsables: Responsable[]; personnesAutorisees: PersonneAutorisee[] }

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
}

// --- Formatage ---

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
