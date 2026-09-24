// Saison courante et son référentiel (spec 003) : tarifs, horaires, catégories, échéances. Lecture
// publique (vitrine comme espace), gardée en cache ; l'écran Saisons l'invalide après une
// modification.
import { useQuery } from '@tanstack/react-query'
import type { Referentiel, Saison } from '../content/referentiel'

export type SaisonPublique = Pick<Saison, 'id' | 'libelle' | 'debut' | 'fin' | 'referentiel'>

export function useSaisonCourante() {
  return useQuery<SaisonPublique>({
    queryKey: ['saison'],
    queryFn: async () => {
      const r = await fetch('/api/saison')
      if (!r.ok) throw new Error(`Saison indisponible (${r.status})`)
      return (await r.json()) as SaisonPublique
    },
    staleTime: 10 * 60 * 1000,
  })
}

/** Référentiel de la saison courante, ou undefined pendant le chargement. */
export const useReferentiel = (): Referentiel | undefined => useSaisonCourante().data?.referentiel

/** Ligne de l'écran Saisons (bureau). */
export type SaisonResume = {
  id: string
  libelle: string
  debut: string
  fin: string
  courante: boolean
  inscriptions_ouvertes: boolean
  modifie_le: string
  dossiers: number
  paiements: number
}
