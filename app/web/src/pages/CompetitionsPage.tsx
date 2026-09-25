import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { CalendarPlus, Check, ChevronRight, Copy, MapPin, Settings } from 'lucide-react'
import { IconeEvenement } from '../components/IconeEvenement'
import { Container, PageHeader, Pastille } from '../components/ui'
import { TYPES_EVENEMENT, type TypeEvenement } from '../content/evenements'
import { aUnRole, appel, useMe } from '../lib/api'
import {
  etatInscriptions,
  heureFr,
  libelleCriteres,
  libelleParticipants,
  libelleType,
  paveDate,
  type CompetitionDetail,
  type EnfantsConcernes,
} from '../lib/competitions'
import { useReferentiel } from '../lib/saison'
import { usePageMeta } from '../lib/usePageMeta'

// Événements du club (specs 009, 021) : compétitions, stages, rencontres, repas… à venir.

export function CompetitionsPage() {
  usePageMeta(
    'Événements',
    'Les prochains événements du club Judo Condat-sur-Vienne : compétitions, stages, rencontres, repas… et inscriptions en ligne.',
  )
  const { data: me } = useMe()
  const connecte = me?.etat === 'ok'
  const [filtre, setFiltre] = useState<TypeEvenement | null>(null)
  const { data, isPending, isError } = useQuery({
    queryKey: ['competitions'],
    queryFn: () => appel<CompetitionDetail[]>('GET', '/api/competitions'),
  })
  // Connecté : mes enfants concernés par chaque événement (inscrits ou non), ou ma famille inscrite.
  const { data: concernes } = useQuery({
    queryKey: ['famille', 'competitions'],
    queryFn: () => appel<EnfantsConcernes>('GET', '/api/famille/competitions'),
    enabled: connecte,
  })
  const types = [...new Set(data?.map((c) => c.type) ?? [])]
  const liste = data?.filter((c) => !filtre || c.type === filtre)

  return (
    <div className="animate-apparition">
      <PageHeader surtitre="Vie du club" titre="Événements">
        Compétitions, stages, rencontres, repas… Ouvrez un événement pour les informations pratiques et, s’il y a lieu, l’inscription
        depuis votre espace.
      </PageHeader>

      <Container className="grid max-w-4xl grid-cols-1 gap-4 py-10 sm:py-14">
        {connecte && aUnRole(me.me, 'bureau', 'admin') && (
          <Link to="/espace/evenements" className="inline-flex items-center gap-2 justify-self-start text-sm font-semibold text-brand">
            <Settings className="size-4" aria-hidden /> Gérer les événements (bureau)
          </Link>
        )}
        {types.length > 1 && (
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrer par type">
            {[null, ...types].map((t) => (
              <button
                key={t ?? 'tous'}
                type="button"
                aria-pressed={filtre === t}
                onClick={() => setFiltre(t)}
                className="inline-flex min-h-10 items-center gap-1.5 rounded-full border bg-white px-3.5 text-sm font-semibold aria-pressed:border-ink aria-pressed:bg-ink aria-pressed:text-white"
              >
                {t && <IconeEvenement type={t} className="size-4" />}
                {t ? TYPES_EVENEMENT[t] : 'Tous'}
              </button>
            ))}
          </div>
        )}
        {isPending && <p className="text-muted-foreground">Chargement…</p>}
        {isError && <p className="text-brand">Impossible de charger les événements.</p>}
        {data?.length === 0 && (
          <p className="rounded-2xl border bg-white p-8 text-center text-muted-foreground shadow-sm">Aucun événement annoncé pour le moment.</p>
        )}
        <ul className="grid grid-cols-1 gap-4">
          {liste?.map((c) => (
            <li key={c.id}>
              <CarteEvenement competition={c} concerne={concernes?.find((x) => x.competition_id === c.id)} />
            </li>
          ))}
        </ul>
        <Abonnement />
      </Container>
    </div>
  )
}

function CarteEvenement({ competition: c, concerne }: { competition: CompetitionDetail; concerne?: EnfantsConcernes[number] }) {
  const d = paveDate(c.date)
  const etat = etatInscriptions(c)
  const categories = useReferentiel()?.categories ?? []
  const inscrits = concerne?.enfants.filter((e) => e.inscrit).map((e) => e.prenom) ?? []
  const aInscrire = concerne?.enfants.filter((e) => !e.inscrit).map((e) => e.prenom) ?? []
  return (
    <Link
      to="/evenements/$id"
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
        <span className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-brand uppercase">
          <IconeEvenement type={c.type} className="size-4" /> {libelleType(c.type)}
        </span>
        <span className={`mt-0.5 block text-lg leading-snug font-bold ${c.statut === 'annulee' ? 'line-through' : ''}`}>{c.nom}</span>
        <span className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="size-3.5 shrink-0" aria-hidden />
          <span className="truncate">
            {c.heure ? `${heureFr(c.heure)} · ` : ''}
            {c.lieu}
          </span>
        </span>
        {c.inscription === 'enfants' && <span className="mt-0.5 block text-sm text-muted-foreground">{libelleCriteres(c, categories)}</span>}
        <Pastille ton={etat.ton} className="mt-2">
          {etat.libelle}
        </Pastille>
        {concerne?.famille && (
          <span className="mt-2 block text-sm font-semibold text-emerald-700">Votre famille est inscrite : {libelleParticipants(concerne.famille)}</span>
        )}
        {inscrits.length > 0 && <span className="mt-2 block text-sm font-semibold text-emerald-700">Inscrits : {inscrits.join(', ')}</span>}
        {aInscrire.length > 0 && etat.ton === 'ouvert' && (
          <span className="mt-1 block text-sm font-semibold text-brand">Pas encore inscrits : {aInscrire.join(', ')}</span>
        )}
      </span>
      <ChevronRight className="size-5 shrink-0 self-center text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden />
    </Link>
  )
}

/** Abonnement agenda (spec 013) : le calendrier des événements dans le téléphone, mis à jour tout seul. */
function Abonnement() {
  const [copie, setCopie] = useState(false)
  const https = `${window.location.origin}/api/calendrier.ics`
  const webcal = https.replace(/^https?:/, 'webcal:')
  const bouton = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-full border bg-white px-4 text-sm font-semibold hover:border-brand/40 hover:text-brand'
  return (
    <section aria-labelledby="abonnement" className="mt-4 grid gap-3 rounded-2xl border bg-white p-5 shadow-sm">
      <h2 id="abonnement" className="flex items-center gap-2 text-lg font-bold">
        <CalendarPlus className="size-5 text-brand" aria-hidden /> S’abonner au calendrier
      </h2>
      <p className="text-sm text-muted-foreground">Les événements du club dans l’agenda de votre téléphone, mis à jour automatiquement.</p>
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <a href={webcal} className={bouton}>
          Calendrier (iPhone, Mac, Outlook)
        </a>
        <a href={`https://calendar.google.com/calendar/render?cid=${encodeURIComponent(webcal)}`} target="_blank" rel="noopener noreferrer" className={bouton}>
          Google Agenda
        </a>
        <button
          type="button"
          className={bouton}
          onClick={async () => {
            await navigator.clipboard.writeText(https)
            setCopie(true)
          }}
        >
          {copie ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />} {copie ? 'Adresse copiée' : 'Copier l’adresse'}
        </button>
      </div>
    </section>
  )
}
