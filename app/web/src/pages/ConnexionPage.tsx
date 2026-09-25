import { useEffect, useState, type ReactNode } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Fingerprint, KeyRound, LoaderCircle, TriangleAlert } from 'lucide-react'
import { browserSupportsWebAuthn } from '@simplewebauthn/browser'
import { Container } from '../components/ui'
import { Alerte, Bouton } from '../components/formulaire'
import { appel, changerUtilisateur, ErreurApi, useMe } from '../lib/api'
import { usePageMeta } from '../lib/usePageMeta'
import { annule, choixPasskey, nomDeverrouillage, seConnecterParPasskey } from '../lib/passkey'

// Jeton du lien de connexion : dans le fragment de l'URL (/connexion#…), jamais envoyé au serveur
// par un aperçu de lien ; lu une seule fois à l'ouverture de la page.
const lireJeton = () => {
  const j = window.location.hash.slice(1)
  return /^[A-Za-z0-9_-]{43}$/.test(j) ? j : null
}

// Navigateurs intégrés aux applications (Facebook, Instagram, WebView Android, iOS sans Safari) :
// la session y resterait enfermée, loin du navigateur habituel.
const navigateurIntegre = () => {
  const ua = navigator.userAgent
  return /FBAN|FBAV|FB_IAB|Instagram|LinkedInApp|Snapchat|; wv\)/.test(ua) || (/iPhone|iPad/.test(ua) && !/Safari\//.test(ua))
}

export function ConnexionPage() {
  usePageMeta('Connexion', 'Connexion à l’espace membres du club Judo Condat-sur-Vienne.')
  const [jeton, setJeton] = useState(lireJeton)
  // Lien collé dans un onglet déjà ouvert sur /connexion : seul le fragment change.
  useEffect(() => {
    const maj = () => setJeton(lireJeton())
    window.addEventListener('hashchange', maj)
    return () => window.removeEventListener('hashchange', maj)
  }, [])
  return (
    <div className="animate-apparition min-h-[calc(100dvh-4rem)] bg-surface sm:min-h-[calc(100dvh-4.5rem)]">
      <Container className="max-w-xl py-10 sm:py-16">
        {jeton ? <AccueilLien key={jeton} jeton={jeton} /> : <CommentSeConnecter />}
      </Container>
    </div>
  )
}

function Carte({ titre, icone, children }: { titre: string; icone: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-2xl border bg-white p-6 text-center shadow-sm sm:p-8">
      <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-brand-soft text-brand">{icone}</span>
      <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-balance sm:text-3xl">{titre}</h1>
      <div className="mt-3 grid gap-4 text-muted-foreground">{children}</div>
    </section>
  )
}

function AccueilLien({ jeton }: { jeton: string }) {
  const client = useQueryClient()
  const navigate = useNavigate()
  const { data: me } = useMe()
  const [erreur, setErreur] = useState('')
  const [enCours, setEnCours] = useState(false)
  // Vérifie le lien SANS le consommer : un rechargement de page ne le grille pas.
  const infos = useQuery({
    queryKey: ['connexion', 'lien', jeton],
    queryFn: () => appel<{ prenom: string }>('POST', '/api/auth/lien/infos', { jeton }),
    retry: false,
    staleTime: Infinity,
  })

  async function seConnecter() {
    setEnCours(true)
    setErreur('')
    try {
      await appel('POST', '/api/auth/lien', { jeton })
      // Le lien est consommé : on le retire de l'adresse (historique, favoris, partage d'écran).
      window.history.replaceState(null, '', '/connexion')
      await changerUtilisateur(client)
      navigate({ to: '/espace' })
    } catch (err) {
      setErreur(err instanceof ErreurApi && err.statut === 410 ? 'Ce lien vient d’être utilisé ou a expiré.' : 'Connexion impossible, réessayez.')
      setEnCours(false)
    }
  }

  if (infos.isPending) {
    return (
      <p className="flex items-center justify-center gap-2 text-muted-foreground">
        <LoaderCircle className="size-5 animate-spin" aria-hidden /> Vérification du lien…
      </p>
    )
  }
  if (infos.isError) {
    return (
      <Carte titre="Ce lien n’est plus valable" icone={<TriangleAlert className="size-7" />}>
        <p>Il a déjà servi, a expiré (7 jours) ou a été remplacé par un lien plus récent.</p>
        <p>
          Demandez un nouveau lien au bureau du club. Si vous vous êtes déjà connecté·e sur ce téléphone,{' '}
          <Link to="/espace" className="font-semibold text-brand">
            ouvrez votre espace
          </Link>
          .
        </p>
      </Carte>
    )
  }

  const autreCompte = me?.etat === 'ok' ? me.me : null
  return (
    <Carte titre={`Bonjour ${infos.data.prenom}`} icone={<KeyRound className="size-7" />}>
      <p>Ce lien personnel vous connecte à l’espace membres du club sur cet appareil. Vous resterez connecté·e pendant 6 mois.</p>
      {navigateurIntegre() && (
        <p className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-left text-sm text-amber-900">
          Vous êtes dans le navigateur intégré d’une application : pour rester connecté·e, ouvrez plutôt ce lien dans Safari ou
          Chrome (menu ⋯ → « Ouvrir dans le navigateur »).
        </p>
      )}
      {autreCompte && (
        <p className="text-sm">
          Vous êtes actuellement connecté·e en tant que {autreCompte.prenom} {autreCompte.nom} : ce lien vous connectera en tant que{' '}
          {infos.data.prenom}.
        </p>
      )}
      <Alerte>{erreur}</Alerte>
      <Bouton enCours={enCours} onClick={seConnecter}>
        Me connecter sur cet appareil
      </Bouton>
      <p className="text-xs">
        Ce lien ne fonctionne qu’une fois : ne le transférez à personne. Ce que le club enregistre sur vous :{' '}
        <Link to="/donnees-personnelles" className="font-semibold text-brand">
          données personnelles
        </Link>
        .
      </p>
    </Carte>
  )
}

function CommentSeConnecter() {
  const { data: me } = useMe()
  if (me?.etat === 'ok') {
    return (
      <Carte titre="Vous êtes connecté·e" icone={<KeyRound className="size-7" />}>
        <p>
          Bonjour {me.me.prenom}, votre espace vous attend.
        </p>
        <Link to="/espace" className="mx-auto inline-flex min-h-12 items-center rounded-full bg-brand px-6 font-semibold text-white hover:bg-brand-dark">
          Ouvrir mon espace
        </Link>
      </Carte>
    )
  }
  // Passkey activée sur ce téléphone : c'est le moyen proposé en premier.
  const activee = choixPasskey() === 'activee'
  return (
    <Carte titre="Espace membres" icone={<KeyRound className="size-7" />}>
      {activee && <ConnexionPasskey principale />}
      <p>
        Pour vous connecter, touchez le <strong className="text-foreground">lien personnel</strong> que le bureau du club vous a envoyé
        (WhatsApp ou SMS), depuis votre téléphone. Vous restez ensuite connecté·e pendant 6 mois.
      </p>
      <p>
        Pas de lien, ou lien expiré ? Demandez-en un nouveau au bureau du club (
        <Link to="/contact" className="font-semibold text-brand">
          contact
        </Link>
        ).
      </p>
      {!activee && <ConnexionPasskey />}
    </Carte>
  )
}

/** Connexion par Face ID / empreinte (spec 005c), si elle a été activée sur ce téléphone. */
function ConnexionPasskey({ principale = false }: { principale?: boolean }) {
  const client = useQueryClient()
  const navigate = useNavigate()
  const [erreur, setErreur] = useState('')
  const [info, setInfo] = useState('')
  const [enCours, setEnCours] = useState(false)
  if (!browserSupportsWebAuthn()) return null

  async function seConnecter() {
    setEnCours(true)
    setErreur('')
    setInfo('')
    try {
      await seConnecterParPasskey()
      await changerUtilisateur(client)
      navigate({ to: '/espace' })
    } catch (err) {
      // Fenêtre fermée, ou aucune passkey du club sur ce téléphone : le navigateur ne dit pas lequel.
      if (annule(err)) setInfo('Pas de connexion. Rien ne vous est proposé ? Utilisez votre lien personnel.')
      else setErreur(err instanceof ErreurApi ? err.message : 'Connexion impossible, réessayez ou utilisez votre lien.')
      setEnCours(false)
    }
  }

  return (
    <div className={`grid gap-3 ${principale ? '' : 'border-t pt-4'}`}>
      {!principale && <p className="text-sm">Vous avez activé la connexion sans lien sur ce téléphone ?</p>}
      <Bouton variante={principale ? 'primaire' : 'secondaire'} enCours={enCours} onClick={seConnecter}>
        <Fingerprint className="size-5" aria-hidden /> Se connecter avec {nomDeverrouillage()}
      </Bouton>
      <Alerte>{erreur}</Alerte>
      {info && <p className="text-sm">{info}</p>}
      {principale && (
        <p className="flex items-center gap-3 text-sm before:h-px before:flex-1 before:bg-border after:h-px after:flex-1 after:bg-border">ou</p>
      )}
    </div>
  )
}
