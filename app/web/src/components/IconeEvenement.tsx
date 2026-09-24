import { CalendarDays, Dumbbell, Handshake, PartyPopper, Trophy, UtensilsCrossed, type LucideIcon } from 'lucide-react'
import type { TypeEvenement } from '../content/evenements'

// Pictogramme de chaque type d'événement (spec 021).
const ICONES: Record<TypeEvenement, LucideIcon> = {
  competition: Trophy,
  stage: Dumbbell,
  rencontre: Handshake,
  repas: UtensilsCrossed,
  fete: PartyPopper,
  autre: CalendarDays,
}

export function IconeEvenement({ type, className = 'size-5' }: { type: TypeEvenement; className?: string }) {
  const Icone = ICONES[type] ?? CalendarDays
  return <Icone className={className} aria-hidden />
}
