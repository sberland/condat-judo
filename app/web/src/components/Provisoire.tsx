import type { ReactNode } from 'react'
import { useHealth } from '../lib/api'
import { afficherProvisoire } from '../lib/provisoire'

/** Vrai si les contenus provisoires peuvent être affichés (local / qualification uniquement). */
export function useProvisoireVisible(): boolean {
  const { data } = useHealth()
  return afficherProvisoire(data?.environment)
}

/**
 * Enveloppe un contenu provisoire : cadre pointillé + badge « À compléter » en local et en
 * qualification ; rien en production (ni tant que l'environnement n'est pas connu).
 */
export function Provisoire({ children, className = '' }: { children: ReactNode; className?: string }) {
  if (!useProvisoireVisible()) return null
  return (
    <div className={`relative rounded-2xl outline-2 outline-offset-4 outline-amber-400 outline-dashed ${className}`}>
      <span className="absolute -top-3 right-4 z-10 rounded-full bg-amber-400 px-2.5 py-0.5 text-xs font-bold text-ink">
        À compléter
      </span>
      {children}
    </div>
  )
}
