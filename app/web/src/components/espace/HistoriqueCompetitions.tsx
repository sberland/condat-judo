import { Link } from '@tanstack/react-router'
import { dateFr } from '../../lib/api'
import type { CompetitionEnfant } from '../../lib/competitions'
import { IconeEvenement } from '../IconeEvenement'

/** Événements auxquels un enfant a été inscrit (specs 009, 021), du plus récent au plus ancien. */
export function HistoriqueCompetitions({ competitions, vers }: { competitions: CompetitionEnfant[]; vers: 'public' | 'bureau' }) {
  if (!competitions.length) return <p className="text-muted-foreground">Aucune pour l’instant.</p>
  const aujourdhui = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Paris' })
  return (
    <ul className="grid gap-1">
      {competitions.map((c) => (
        <li key={c.id} className="flex flex-wrap items-center gap-x-1.5">
          <IconeEvenement type={c.type ?? 'competition'} className="size-4 shrink-0 text-brand" />
          <span className="text-muted-foreground">{dateFr(c.date)} · </span>
          <Link
            to={vers === 'bureau' ? '/espace/evenements/$id' : '/evenements/$id'}
            params={{ id: String(c.id) }}
            className={`font-medium hover:text-brand ${c.statut === 'annulee' ? 'line-through' : ''}`}
          >
            {c.nom}
          </Link>
          {c.statut === 'annulee' && <span className="text-muted-foreground"> (annulé)</span>}
          {c.statut !== 'annulee' && c.date >= aujourdhui && <span className="font-semibold text-emerald-700"> · à venir</span>}
        </li>
      ))}
    </ul>
  )
}
