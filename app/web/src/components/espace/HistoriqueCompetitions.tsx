import { Link } from '@tanstack/react-router'
import { dateFr } from '../../lib/api'
import type { CompetitionEnfant } from '../../lib/competitions'

/** Compétitions auxquelles un enfant a été inscrit (spec 009), de la plus récente à la plus ancienne. */
export function HistoriqueCompetitions({ competitions, vers }: { competitions: CompetitionEnfant[]; vers: 'public' | 'bureau' }) {
  if (!competitions.length) return <p className="text-muted-foreground">Aucune pour l’instant.</p>
  const aujourdhui = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Paris' })
  return (
    <ul className="grid gap-1">
      {competitions.map((c) => (
        <li key={c.id}>
          <span className="text-muted-foreground">{dateFr(c.date)} · </span>
          <Link
            to={vers === 'bureau' ? '/espace/competitions/$id' : '/competitions/$id'}
            params={{ id: String(c.id) }}
            className={`font-medium hover:text-brand ${c.statut === 'annulee' ? 'line-through' : ''}`}
          >
            {c.nom}
          </Link>
          {c.statut === 'annulee' && <span className="text-muted-foreground"> (annulée)</span>}
          {c.statut !== 'annulee' && c.date >= aujourdhui && <span className="font-semibold text-emerald-700"> · à venir</span>}
        </li>
      ))}
    </ul>
  )
}
