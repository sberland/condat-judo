import { useHealth } from '../lib/api'

// Badge permanent (overlay) indiquant qu'on n'est PAS en production, avec la version déployée.
// L'environnement vient de l'API (/api/health → ENVIRONMENT du Worker), pas du nom d'hôte : aucune
// URL codée en dur. En `position: fixed`, en bas à droite (décision du 2026-09-24) ; une marge de
// même couleur que le pied de page, en fin de page, évite qu'il en masque la dernière ligne
// (dont le numéro de version).

const LABELS = { preview: 'Preview / Qualif', local: 'Dev local' } as const

export function EnvBanner() {
  const { data } = useHealth()
  if (!data || data.environment === 'production') return null
  return (
    <>
      <div className="h-14 bg-ink" aria-hidden />
      <div className="pointer-events-none fixed right-3 bottom-3 z-50">
        <div className="rounded-full bg-amber-500 px-4 py-1 text-xs font-bold tracking-wider text-white uppercase shadow-lg">
          {LABELS[data.environment]} · v{data.version} — pas la production
        </div>
      </div>
    </>
  )
}
