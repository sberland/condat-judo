import { useQuery } from '@tanstack/react-query'

export type Environnement = 'production' | 'preview' | 'local'

export type Health = { status: string; version: string; environment: Environnement }

export type Me = {
  id: number
  prenom: string
  nom: string
  email: string | null
  role: 'admin' | 'membre'
  provider: string
}

/** Résultat d'appel qui distingue « non connecté » / « compte non reconnu » d'une erreur. */
export type MeResult = { etat: 'ok'; me: Me } | { etat: 'anonyme' } | { etat: 'inconnu' }

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

// Utilisateur connecté résolu par le Worker (seam d'identité) : Cloudflare Access en ligne,
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
