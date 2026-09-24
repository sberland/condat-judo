import { useState, type ReactNode } from 'react'
import { Link, useParams } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { CalendarDays, Check, ChevronLeft, ExternalLink, Info, MapPin, Navigation, Settings, Users } from 'lucide-react'
import { Alerte, Bouton } from '../components/formulaire'
import { BoutonExterne, Card, Container, PageHeader, Pastille } from '../components/ui'
import { libelleCategorie } from '../content/categories'
import { useReferentiel } from '../lib/saison'
import { aUnRole, appel, ErreurApi, useMe } from '../lib/api'
import {
  dateLongue,
  etatInscriptions,
  lienItineraire,
  type CompetitionDetail,
  type MesEnfantsCompetition,
} from '../lib/competitions'
import { usePageMeta } from '../lib/usePageMeta'

export function CompetitionPage() {
  const { id } = useParams({ from: '/competitions/$id' })
  const { data: c, isPending, isError } = useQuery({
    queryKey: ['competitions', id],
    queryFn: () => appel<CompetitionDetail>('GET', `/api/competitions/${id}`),
    retry: false,
  })
  const categories = useReferentiel()?.categories ?? []
  usePageMeta(c?.nom ?? 'Compétition', c ? `${c.nom} — ${dateLongue(c.date)}, ${c.lieu}.` : 'Compétition du club Judo Condat-sur-Vienne.')

  if (isPending || isError) {
    return (
      <div className="animate-apparition">
        <PageHeader surtitre="Compétition" titre={isPending ? 'Chargement…' : 'Compétition introuvable'}>
          {isError && (
            <Link to="/competitions" className="font-semibold text-white underline">
              Voir les compétitions à venir
            </Link>
          )}
        </PageHeader>
      </div>
    )
  }

  const etat = etatInscriptions(c)
  return (
    <div className="animate-apparition">
      <PageHeader surtitre="Compétition" titre={c.nom}>
        <span className="block">{dateLongue(c.date).replace(/^./, (l) => l.toUpperCase())}</span>
        <span className="block">{c.lieu}</span>
      </PageHeader>

      <Container className="grid max-w-4xl gap-6 py-8 sm:py-12">
        <Link to="/competitions" className="inline-flex items-center gap-1 justify-self-start text-sm font-semibold text-muted-foreground hover:text-brand">
          <ChevronLeft className="size-4" aria-hidden /> Toutes les compétitions
        </Link>

        {c.statut === 'annulee' && (
          <p role="status" className="rounded-2xl border border-brand/30 bg-brand-soft px-5 py-4 font-semibold text-brand">
            Cette compétition est annulée.
          </p>
        )}

        {c.statut !== 'annulee' && <Inscription competition={c} />}

        <Card className="grid gap-5">
          <h2 className="text-xl font-bold">Informations</h2>
          <dl className="grid gap-4 sm:grid-cols-2">
            <Info2 icone={<CalendarDays className="size-5" />} titre="Date">
              {dateLongue(c.date)}
            </Info2>
            <Info2 icone={<MapPin className="size-5" />} titre="Lieu">
              {c.lieu}
              {c.adresse && <span className="block text-muted-foreground">{c.adresse}</span>}
            </Info2>
            <Info2 icone={<Users className="size-5" />} titre={c.sexe === 'F' ? 'Filles' : c.sexe === 'M' ? 'Garçons' : 'Catégories'}>
              <ul>
                {categories.filter((cat) => c.categories.includes(cat.id)).map((cat) => (
                  <li key={cat.id}>{libelleCategorie(cat)}</li>
                ))}
              </ul>
            </Info2>
            <Info2 icone={<Check className="size-5" />} titre="Inscriptions">
              <Pastille ton={etat.ton}>{etat.libelle}</Pastille>
            </Info2>
          </dl>
          {c.infos && (
            <div className="rounded-xl bg-surface p-4">
              <p className="mb-1 flex items-center gap-2 text-sm font-semibold">
                <Info className="size-4 text-brand" aria-hidden /> Informations pratiques
              </p>
              <p className="whitespace-pre-line">{c.infos}</p>
            </div>
          )}
          <div className="flex flex-col gap-3 sm:flex-row">
            <BoutonExterne href={lienItineraire(c)}>
              <Navigation className="size-4" aria-hidden /> Itinéraire
            </BoutonExterne>
            {c.lien_officiel && (
              <BoutonExterne href={c.lien_officiel} variante="contour">
                <ExternalLink className="size-4" aria-hidden /> Page officielle
              </BoutonExterne>
            )}
          </div>
        </Card>
      </Container>
    </div>
  )
}

function Info2({ icone, titre, children }: { icone: ReactNode; titre: string; children: ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand" aria-hidden>
        {icone}
      </span>
      <div>
        <dt className="text-sm text-muted-foreground">{titre}</dt>
        <dd className="font-medium">{children}</dd>
      </div>
    </div>
  )
}

/** Bloc « Inscrire mes enfants » : connexion requise ; rien sur les enfants n'est public. */
function Inscription({ competition: c }: { competition: CompetitionDetail }) {
  const { data: me } = useMe()

  if (me?.etat === 'anonyme') {
    return (
      <Card className="grid gap-3">
        <h2 className="text-xl font-bold">Inscrire mes enfants</h2>
        <p className="text-muted-foreground">
          {c.inscriptionsOuvertes
            ? 'Connectez-vous à votre espace pour inscrire vos enfants, avec le lien personnel envoyé par le bureau du club.'
            : 'Les inscriptions sont closes pour cette compétition.'}
        </p>
        {c.inscriptionsOuvertes && (
          <div>
            <Link to="/connexion" className="inline-flex min-h-12 items-center rounded-full bg-brand px-6 font-semibold text-white hover:bg-brand-dark">
              Se connecter
            </Link>
          </div>
        )}
      </Card>
    )
  }
  if (me?.etat === 'inconnu') {
    return (
      <Card>
        <p className="font-semibold">Compte non reconnu : contactez le bureau du club pour inscrire vos enfants.</p>
      </Card>
    )
  }
  if (me?.etat !== 'ok') return null
  return <MesEnfants competition={c} bureau={aUnRole(me.me, 'bureau', 'admin')} />
}

function MesEnfants({ competition: c, bureau }: { competition: CompetitionDetail; bureau: boolean }) {
  const client = useQueryClient()
  const [enCours, setEnCours] = useState<number | null>(null)
  const [erreur, setErreur] = useState('')
  const { data, isPending, isError } = useQuery({
    queryKey: ['famille', 'competitions', c.id],
    queryFn: () => appel<MesEnfantsCompetition>('GET', `/api/famille/competitions/${c.id}`),
  })

  async function changer(adherentId: number, inscrire: boolean) {
    setEnCours(adherentId)
    setErreur('')
    try {
      await appel(inscrire ? 'PUT' : 'DELETE', `/api/famille/competitions/${c.id}/inscriptions/${adherentId}`)
      await client.invalidateQueries({ queryKey: ['famille'] })
    } catch (err) {
      setErreur(err instanceof ErreurApi ? err.message : 'Action impossible, réessayez.')
      await client.invalidateQueries({ queryKey: ['competitions', String(c.id)] })
    } finally {
      setEnCours(null)
    }
  }

  const ouvertes = data?.inscriptionsOuvertes ?? c.inscriptionsOuvertes
  return (
    <Card className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-bold">Mes enfants</h2>
        {bureau && (
          <Link
            to="/espace/competitions/$id"
            params={{ id: String(c.id) }}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand"
          >
            <Settings className="size-4" aria-hidden /> Tous les inscrits (bureau)
          </Link>
        )}
      </div>
      {isPending && <p className="text-muted-foreground">Chargement…</p>}
      {isError && <Alerte>Impossible de charger vos enfants.</Alerte>}
      {data?.enfants.length === 0 && <p className="text-muted-foreground">Aucun enfant n’est rattaché à votre compte.</p>}
      {data && data.enfants.length > 0 && (
        <ul className="divide-y rounded-xl border">
          {data.enfants.map((e) => (
            <li key={e.id} className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold">
                  {e.prenom} {e.nom}
                </p>
                <p className="text-sm text-muted-foreground">{e.categorie ?? 'Catégorie inconnue'}</p>
              </div>
              <EtatEnfant enfant={e} ouvertes={ouvertes} enCours={enCours === e.id} onChange={(v) => changer(e.id, v)} />
            </li>
          ))}
        </ul>
      )}
      <Alerte>{erreur}</Alerte>
      {!ouvertes && data && data.enfants.length > 0 && (
        <p className="text-sm text-muted-foreground">Les inscriptions sont closes : pour un changement, contactez le bureau du club.</p>
      )}
    </Card>
  )
}

function EtatEnfant({
  enfant: e,
  ouvertes,
  enCours,
  onChange,
}: {
  enfant: MesEnfantsCompetition['enfants'][number]
  ouvertes: boolean
  enCours: boolean
  onChange: (inscrire: boolean) => void
}) {
  const modifiable = ouvertes && e.peutInscrire
  if (e.inscrit) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-700">
          <Check className="size-5" aria-hidden /> Inscription faite
        </span>
        {modifiable && (
          <Bouton variante="secondaire" enCours={enCours} onClick={() => onChange(false)}>
            Annuler l’inscription
          </Bouton>
        )}
      </div>
    )
  }
  if (!e.eligible) return <span className="text-sm text-muted-foreground">Pas dans les catégories de la compétition</span>
  if (!ouvertes) return <span className="text-sm text-muted-foreground">Pas inscrit</span>
  if (!e.peutInscrire) return <span className="text-sm text-muted-foreground">Inscription par un autre responsable</span>
  return (
    <Bouton enCours={enCours} onClick={() => onChange(true)}>
      Inscrire {e.prenom}
    </Bouton>
  )
}
