import { Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { ChevronRight, MapPin, Settings } from 'lucide-react'
import { Container, PageHeader, Pastille } from '../components/ui'
import { aUnRole, appel, useMe } from '../lib/api'
import { etatInscriptions, libelleCriteres, paveDate, type CompetitionDetail, type EnfantsConcernes } from '../lib/competitions'
import { useReferentiel } from '../lib/saison'
import { usePageMeta } from '../lib/usePageMeta'

export function CompetitionsPage() {
  usePageMeta(
    'Compétitions',
    'Les prochaines compétitions du club Judo Condat-sur-Vienne : dates, lieux, catégories et inscription des enfants.',
  )
  const { data: me } = useMe()
  const connecte = me?.etat === 'ok'
  const { data, isPending, isError } = useQuery({
    queryKey: ['competitions'],
    queryFn: () => appel<CompetitionDetail[]>('GET', '/api/competitions'),
  })
  // Connecté : mes enfants concernés par chaque compétition (inscrits ou non).
  const { data: concernes } = useQuery({
    queryKey: ['famille', 'competitions'],
    queryFn: () => appel<EnfantsConcernes>('GET', '/api/famille/competitions'),
    enabled: connecte,
  })

  return (
    <div className="animate-apparition">
      <PageHeader surtitre="Vie du club" titre="Compétitions">
        Les prochaines compétitions du club. Parents : ouvrez une compétition pour y inscrire vos enfants depuis votre espace.
      </PageHeader>

      <Container className="grid max-w-4xl grid-cols-1 gap-4 py-10 sm:py-14">
        {connecte && aUnRole(me.me, 'bureau', 'admin') && (
          <Link to="/espace/competitions" className="inline-flex items-center gap-2 justify-self-start text-sm font-semibold text-brand">
            <Settings className="size-4" aria-hidden /> Gérer les compétitions (bureau)
          </Link>
        )}
        {isPending && <p className="text-muted-foreground">Chargement…</p>}
        {isError && <p className="text-brand">Impossible de charger les compétitions.</p>}
        {data?.length === 0 && (
          <p className="rounded-2xl border bg-white p-8 text-center text-muted-foreground shadow-sm">
            Aucune compétition annoncée pour le moment.
          </p>
        )}
        <ul className="grid grid-cols-1 gap-4">
          {data?.map((c) => (
            <li key={c.id}>
              <CarteCompetition competition={c} enfants={concernes?.find((x) => x.competition_id === c.id)?.enfants} />
            </li>
          ))}
        </ul>
      </Container>
    </div>
  )
}

function CarteCompetition({ competition: c, enfants }: { competition: CompetitionDetail; enfants?: EnfantsConcernes[number]['enfants'] }) {
  const d = paveDate(c.date)
  const etat = etatInscriptions(c)
  const categories = useReferentiel()?.categories ?? []
  const inscrits = enfants?.filter((e) => e.inscrit).map((e) => e.prenom) ?? []
  const aInscrire = enfants?.filter((e) => !e.inscrit).map((e) => e.prenom) ?? []
  return (
    <Link
      to="/competitions/$id"
      params={{ id: String(c.id) }}
      className="group flex items-stretch gap-4 rounded-2xl border bg-white p-4 shadow-sm transition hover:border-brand/40 hover:shadow-md sm:p-5"
    >
      <span
        className={`flex w-16 shrink-0 flex-col items-center justify-center rounded-xl py-2 text-center ${c.statut === 'annulee' ? 'bg-surface text-muted-foreground' : 'bg-ink text-white'}`}
      >
        <span className="text-xs uppercase opacity-80">{d.semaine}</span>
        <span className="text-2xl leading-tight font-extrabold">{d.jour}</span>
        <span className="text-xs uppercase opacity-80">{d.mois}</span>
      </span>
      <span className="min-w-0 flex-1">
        <span className={`block text-lg leading-snug font-bold ${c.statut === 'annulee' ? 'line-through' : ''}`}>{c.nom}</span>
        <span className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="size-3.5 shrink-0" aria-hidden />
          <span className="truncate">{c.lieu}</span>
        </span>
        <span className="mt-0.5 block text-sm text-muted-foreground">{libelleCriteres(c, categories)}</span>
        <Pastille ton={etat.ton} className="mt-2">
          {etat.libelle}
        </Pastille>
        {inscrits.length > 0 && <span className="mt-2 block text-sm font-semibold text-emerald-700">Inscrits : {inscrits.join(', ')}</span>}
        {aInscrire.length > 0 && etat.ton === 'ouvert' && (
          <span className="mt-1 block text-sm font-semibold text-brand">Pas encore inscrits : {aInscrire.join(', ')}</span>
        )}
      </span>
      <ChevronRight className="size-5 shrink-0 self-center text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden />
    </Link>
  )
}
