// Contenu du site administré par le club (spec 014), côté pages : lu une fois par visite
// (/api/contenu, revalidé par ETag), gardé dans le navigateur pour la visite suivante, et
// remplacé par le contenu initial du code tant que l'API n'a pas répondu ou si elle est injoignable.
import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { CLES_CONTENU, type CleContenu, type Contenus, type StatutContenu } from '../content/contenu'
import { CONTENU_INITIAL, STATUTS_INITIAUX } from '../content/contenu-initial'
import { useProvisoireVisible } from '../components/Provisoire'

export type ReponseContenu = Partial<Record<CleContenu, { valeur: unknown; statut: StatutContenu; modifie_le: string }>>

export type ContenuSite = Contenus & { statuts: Record<CleContenu, StatutContenu> }

const STOCKAGE = 'condat-judo:contenu'

/** Dernier contenu reçu (visite précédente), s'il existe. */
export function lireCache(): ReponseContenu | undefined {
  try {
    const brut = localStorage.getItem(STOCKAGE)
    return brut ? (JSON.parse(brut) as ReponseContenu) : undefined
  } catch {
    return undefined
  }
}

export const requeteContenu = {
  queryKey: ['contenu'],
  queryFn: async (): Promise<ReponseContenu> => {
    const r = await fetch('/api/contenu', { credentials: 'same-origin' })
    if (!r.ok) throw new Error('Contenu indisponible')
    const donnees = (await r.json()) as ReponseContenu
    try {
      localStorage.setItem(STOCKAGE, JSON.stringify(donnees))
    } catch {
      /* stockage indisponible (navigation privée) : sans conséquence */
    }
    return donnees
  },
}

/** Réponse de l'API complétée par le contenu initial (document absent ou API injoignable). */
export function versContenu(r: ReponseContenu | undefined): ContenuSite {
  const sortie = { ...CONTENU_INITIAL, statuts: { ...STATUTS_INITIAUX } } as ContenuSite
  for (const cle of CLES_CONTENU) {
    const doc = r?.[cle]
    if (!doc) continue
    ;(sortie as Record<string, unknown>)[cle] = doc.valeur
    sortie.statuts[cle] = doc.statut
  }
  return sortie
}

export function useContenu(): ContenuSite {
  // Le cache local s'affiche aussitôt, puis la version à jour le remplace.
  const { data } = useQuery({ ...requeteContenu, initialData: lireCache, initialDataUpdatedAt: 0, staleTime: 60_000 })
  return useMemo(() => versContenu(data), [data])
}

/**
 * Un contenu « à compléter » (spec 014) : visible avec un badge en local et en qualification,
 * jamais en production.
 */
export function useAffichable(): (statut: StatutContenu) => boolean {
  const visible = useProvisoireVisible()
  return (statut) => statut === 'publie' || visible
}

// --- Écrans de gestion (rôles contenu et admin) ---

export type LigneContenu = { cle: CleContenu; statut: StatutContenu; modifie_le: string; modifie_par: string | null; versions: number }

export type VersionContenu = { id: number; statut: StatutContenu; modifie_le: string; modifie_par: string | null }

export type DetailContenu = { cle: CleContenu; valeur: Record<string, unknown>; statut: StatutContenu; modifie_le: string; modifie_par: string | null; versions: VersionContenu[] }

/** Page publique où se voit chaque contenu (« Voir sur le site »). */
export const PAGE_DU_CONTENU: Record<CleContenu, '/' | '/contact' | '/mentions-legales' | '/club' | '/disciplines' | '/reglement'> = {
  contact: '/contact',
  club: '/',
  association: '/mentions-legales',
  equipe: '/club',
  disciplines: '/disciplines',
  partenaires: '/club',
  reglement: '/reglement',
  liens: '/club',
}
