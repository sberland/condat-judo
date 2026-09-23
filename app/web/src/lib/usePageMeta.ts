import { useEffect } from 'react'

const SITE = 'Judo Condat-sur-Vienne'

/** Titre d'onglet + meta description par page. */
export function usePageMeta(titre: string | null, description: string) {
  useEffect(() => {
    document.title = titre ? `${titre} · ${SITE}` : `${SITE} — judo, jujitsu et taïso`
    document.querySelector('meta[name="description"]')?.setAttribute('content', description)
  }, [titre, description])
}
