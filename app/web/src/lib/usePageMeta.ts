import { useEffect } from 'react'
import { LISTE_DISCIPLINES } from '../content/club'
import { useHealth } from './api'

const SITE = 'Judo Condat-sur-Vienne'

// En qualification, l'onglet porte « Qualif · » pour ne jamais confondre avec la production
// (le badge en bas à droite le signale aussi dans la page, cf. EnvBanner).
const PREFIXES = { preview: 'Qualif · ', local: '', production: '' } as const

/** Titre d'onglet + meta description par page. */
export function usePageMeta(titre: string | null, description: string) {
  const { data } = useHealth()
  const prefixe = data ? PREFIXES[data.environment] : ''
  useEffect(() => {
    document.title = prefixe + (titre ? `${titre} · ${SITE}` : `${SITE} — ${LISTE_DISCIPLINES}`)
    document.querySelector('meta[name="description"]')?.setAttribute('content', description)
  }, [prefixe, titre, description])
}
