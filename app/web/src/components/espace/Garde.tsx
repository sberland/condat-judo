import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { ChevronLeft, LoaderCircle, Lock } from 'lucide-react'
import { aUnRole, useMe, type Me, type Role } from '../../lib/api'
import { Container } from '../ui'
import { usePageMeta } from '../../lib/usePageMeta'

/**
 * Enveloppe d'une page de l'espace connecté. Affiche l'état de connexion et, si `roles` est
 * fourni, refuse l'accès sans l'un de ces rôles. Le masquage n'est pas la sécurité : l'API
 * vérifie les mêmes droits (cf. src/worker/droits.ts).
 */
export function Espace({
  titre,
  retour,
  roles,
  children,
}: {
  titre: string
  retour?: { to: '/espace' | '/espace/adherents' | '/espace/comptes'; libelle: string }
  roles?: Role[]
  children: (me: Me) => ReactNode
}) {
  usePageMeta(titre, 'Espace connecté du club Judo Condat-sur-Vienne.')
  const { data, isPending, isError } = useMe()

  let contenu: ReactNode
  if (isPending) {
    contenu = (
      <p className="flex items-center gap-2 text-muted-foreground">
        <LoaderCircle className="size-5 animate-spin" aria-hidden /> Chargement…
      </p>
    )
  } else if (isError) {
    contenu = <Message titre="Service indisponible">Réessayez dans quelques instants.</Message>
  } else if (data.etat === 'anonyme') {
    contenu = (
      <Message titre="Connexion requise">
        Connectez-vous avec le lien personnel envoyé par le bureau du club.{' '}
        <Link to="/connexion" className="font-semibold text-brand">
          Comment se connecter ?
        </Link>
      </Message>
    )
  } else if (data.etat === 'inconnu') {
    contenu = <Message titre="Compte non reconnu">Contactez le bureau du club pour activer votre accès.</Message>
  } else if (roles && !aUnRole(data.me, ...roles)) {
    contenu = <Message titre="Accès réservé">Cette page est réservée au bureau du club.</Message>
  } else {
    contenu = children(data.me)
  }

  return (
    // Hauteur mini = écran moins l'en-tête : pas de bande blanche avant le pied de page sur une page courte.
    <div className="animate-apparition min-h-[calc(100dvh-4rem)] bg-surface sm:min-h-[calc(100dvh-4.5rem)]">
      <Container className="max-w-4xl py-8 sm:py-12">
        {retour && (
          <Link to={retour.to} className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-brand">
            <ChevronLeft className="size-4" aria-hidden /> {retour.libelle}
          </Link>
        )}
        <h1 className="mb-6 text-3xl font-extrabold tracking-tight text-balance sm:text-4xl">{titre}</h1>
        {contenu}
      </Container>
    </div>
  )
}

function Message({ titre, children }: { titre: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border bg-white p-8 text-center shadow-sm">
      <Lock className="mx-auto size-8 text-brand" aria-hidden />
      <p className="mt-3 text-lg font-bold">{titre}</p>
      <p className="mt-1 text-muted-foreground">{children}</p>
    </div>
  )
}

/** Bloc de page de l'espace (fond blanc, titre de section). */
export function Bloc({ titre, action, children }: { titre: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-2xl border bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold">{titre}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}
