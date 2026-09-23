import { useHealth } from '../lib/api'

// Bandeau permanent (overlay) indiquant qu'on n'est PAS en production. L'environnement vient
// de l'API (/api/health → ENVIRONMENT du Worker), pas du nom d'hôte : aucune URL codée en dur.
// En `position: fixed` → aucun décalage de mise en page entre prod et preview.

const LABELS = { preview: 'Preview / Qualif', local: 'Dev local' } as const

export function EnvBanner() {
  const { data } = useHealth()
  if (!data || data.environment === 'production') return null
  return (
    <div className="pointer-events-none fixed right-3 bottom-3 z-50">
      <div className="rounded-full bg-amber-500 px-4 py-1 text-xs font-bold tracking-wider text-white uppercase shadow-lg">
        {LABELS[data.environment]} — pas la production
      </div>
    </div>
  )
}
