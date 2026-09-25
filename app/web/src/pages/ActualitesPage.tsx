import { Link, useParams } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Lock, MessageCircle, Settings } from 'lucide-react'
import { LienBouton } from '../components/formulaire'
import { Container, PageHeader } from '../components/ui'
import { aUnRole, appel, ErreurApi, urlWhatsApp, useMe } from '../lib/api'
import { datePublication, extrait, imageActualite, messageWhatsApp, paragraphes, urlActualite, type Actualite } from '../lib/actualites'
import { usePageMeta } from '../lib/usePageMeta'

// Actualités du club (spec 013) : publiques pour tous, « familles » pour les comptes connectés.

export function ActualitesPage() {
  usePageMeta('Actualités', 'Les nouvelles du club Judo Condat-sur-Vienne : résultats, vie du club, informations pour les familles.')
  const { data: me } = useMe()
  const { data, isPending, isError } = useQuery({
    queryKey: ['actualites', me?.etat === 'ok'],
    queryFn: () => appel<Actualite[]>('GET', '/api/actualites'),
  })

  return (
    <div className="animate-apparition">
      <PageHeader surtitre="Vie du club" titre="Actualités">
        Les nouvelles du club : résultats, sorties, informations pratiques.
      </PageHeader>
      <Container className="grid max-w-4xl grid-cols-1 gap-4 py-10 sm:py-14">
        {me?.etat === 'ok' && aUnRole(me.me, 'bureau', 'contenu', 'admin') && (
          <Link to="/espace/actualites" className="inline-flex items-center gap-2 justify-self-start text-sm font-semibold text-brand">
            <Settings className="size-4" aria-hidden /> Gérer les actualités
          </Link>
        )}
        {me?.etat === 'anonyme' && (
          <p className="flex items-start gap-2 text-sm text-muted-foreground">
            <Lock className="mt-0.5 size-4 shrink-0" aria-hidden />
            {/* Texte dans un seul élément : il revient à la ligne normalement à 360 px. */}
            <span>
              Certaines actualités sont réservées aux familles :{' '}
              <Link to="/connexion" className="font-semibold text-brand">
                connectez-vous
              </Link>
              .
            </span>
          </p>
        )}
        {isPending && <p className="text-muted-foreground">Chargement…</p>}
        {isError && <p className="text-brand">Impossible de charger les actualités.</p>}
        {data?.length === 0 && <p className="rounded-2xl border bg-white p-8 text-center text-muted-foreground shadow-sm">Aucune actualité pour le moment.</p>}
        <ul className="grid gap-4 sm:grid-cols-2">
          {data?.map((a) => (
            <li key={a.id}>
              <CarteActualite actualite={a} />
            </li>
          ))}
        </ul>
      </Container>
    </div>
  )
}

/** Carte d'une actualité (page Actualités, accueil). */
export function CarteActualite({ actualite: a }: { actualite: Actualite }) {
  return (
    <Link
      to="/actualites/$id"
      params={{ id: String(a.id) }}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:border-brand/40 hover:shadow-md"
    >
      {a.image && <img src={imageActualite(a)} alt="" loading="lazy" className="aspect-[16/9] w-full bg-surface object-cover" />}
      <span className="flex flex-1 flex-col p-5">
        <span className="flex flex-wrap items-center gap-2 text-xs font-semibold text-muted-foreground">
          {a.publiee_le && datePublication(a.publiee_le)}
          {a.visibilite === 'familles' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-brand-soft px-2 py-0.5 text-brand">
              <Lock className="size-3" aria-hidden /> Familles
            </span>
          )}
        </span>
        <span className="mt-1 text-lg leading-snug font-bold">{a.titre}</span>
        <span className="mt-2 flex-1 text-sm text-muted-foreground">{extrait(a.texte)}</span>
        <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand">
          Lire la suite <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
        </span>
      </span>
    </Link>
  )
}

export function ActualitePage() {
  const { id } = useParams({ from: '/actualites/$id' })
  const { data: me } = useMe()
  const { data: a, isPending, error } = useQuery({
    queryKey: ['actualites', 'detail', id, me?.etat === 'ok'],
    queryFn: () => appel<Actualite>('GET', `/api/actualites/${id}`),
    retry: false,
  })
  usePageMeta(a?.titre ?? 'Actualité', a ? extrait(a.texte, 150) : 'Actualité du club Judo Condat-sur-Vienne.')

  if (!a) {
    const reservee = error instanceof ErreurApi && error.statut === 401
    return (
      <div className="animate-apparition">
        <PageHeader surtitre="Actualité" titre={isPending ? 'Chargement…' : reservee ? 'Réservée aux familles' : 'Actualité introuvable'}>
          {reservee && (
            <Link to="/connexion" className="font-semibold text-white underline">
              Se connecter
            </Link>
          )}
          {!isPending && !reservee && (
            <Link to="/actualites" className="font-semibold text-white underline">
              Voir les actualités
            </Link>
          )}
        </PageHeader>
      </div>
    )
  }

  return (
    <div className="animate-apparition">
      <PageHeader surtitre="Actualité" titre={a.titre}>
        {a.publiee_le && <span className="block">Publiée le {datePublication(a.publiee_le)}</span>}
      </PageHeader>
      <Container className="grid max-w-3xl gap-6 py-8 sm:py-12">
        <Link to="/actualites" className="inline-flex items-center gap-1 justify-self-start text-sm font-semibold text-muted-foreground hover:text-brand">
          <ChevronLeft className="size-4" aria-hidden /> Toutes les actualités
        </Link>
        {a.visibilite === 'familles' && (
          <p className="inline-flex items-center gap-2 justify-self-start rounded-full bg-brand-soft px-3 py-1 text-sm font-semibold text-brand">
            <Lock className="size-4" aria-hidden /> Réservée aux familles du club
          </p>
        )}
        {a.image && <img src={imageActualite(a)} alt="" className="w-full rounded-2xl bg-surface object-cover" />}
        <div className="space-y-4 text-lg leading-relaxed">
          {paragraphes(a.texte).map((p, i) => (
            <p key={i} className="whitespace-pre-line">
              {p}
            </p>
          ))}
        </div>
        {a.visibilite === 'public' && (
          <div>
            <LienBouton href={urlWhatsApp(messageWhatsApp(a, urlActualite(a.id)), null)} variante="secondaire">
              <MessageCircle className="size-4" aria-hidden /> Partager sur WhatsApp
            </LienBouton>
          </div>
        )}
      </Container>
    </div>
  )
}
