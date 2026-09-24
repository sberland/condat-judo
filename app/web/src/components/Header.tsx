import { useEffect, useState } from 'react'
import { Link, useRouterState } from '@tanstack/react-router'
import { Menu, UserRound, X } from 'lucide-react'
import { CLUB } from '../content/club'
import { useAccesEspace, useNavigation } from './navigation'
import { Container, FacebookIcon } from './ui'

export function Header() {
  const [ouvert, setOuvert] = useState(false)
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const [defile, setDefile] = useState(false)
  const navigation = useNavigation()
  const acces = useAccesEspace()

  // Fermer le menu mobile à chaque navigation.
  useEffect(() => setOuvert(false), [pathname])

  // Ombre de l'en-tête dès que la page défile.
  useEffect(() => {
    const surDefilement = () => setDefile(window.scrollY > 8)
    surDefilement()
    window.addEventListener('scroll', surDefilement, { passive: true })
    return () => window.removeEventListener('scroll', surDefilement)
  }, [])

  // Menu mobile ouvert : pas de défilement de la page dessous, Échap pour fermer.
  useEffect(() => {
    if (!ouvert) return
    const echap = (e: KeyboardEvent) => e.key === 'Escape' && setOuvert(false)
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', echap)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', echap)
    }
  }, [ouvert])

  return (
    <>
      <header
        className={`sticky top-0 z-50 border-b bg-white/85 backdrop-blur-md transition-shadow ${defile ? 'shadow-sm' : 'border-transparent'}`}
      >
        <Container className="flex h-16 items-center justify-between gap-4 sm:h-18">
          <Link to="/" className="flex shrink-0 items-center gap-3" aria-label={`${CLUB.nom} — accueil`}>
            <img src="/logo-judo-condat.png" alt="" className="size-10 rounded-full sm:size-11" width={44} height={44} />
            <span className="leading-tight">
              <span className="block text-base font-extrabold tracking-tight sm:text-lg">{CLUB.nom}</span>
              {/* Masqué sur les plus petits écrans : le logo porte déjà « Condat-sur-Vienne ». */}
              <span className="hidden text-xs text-muted-foreground min-[410px]:block">Condat-sur-Vienne</span>
            </span>
          </Link>

          <div className="flex items-center gap-2">
            {/* Navigation desktop */}
            <nav aria-label="Navigation principale" className="hidden items-center gap-1 xl:flex">
              {navigation.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  activeOptions={{ exact: item.to === '/' }}
                  className="rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground"
                  activeProps={{ className: '!text-brand' }}
                >
                  {item.libelle}
                </Link>
              ))}
            </nav>

            {/* Accès à l'espace membres : toujours visible, y compris sur mobile (spec 018). */}
            <Link
              to={acces.to}
              aria-label={acces.libelle}
              className={`inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full border px-3 text-sm font-semibold transition-colors sm:h-11 sm:px-4 ${
                acces.connecte ? 'border-brand/30 bg-brand-soft text-brand hover:border-brand' : 'bg-white hover:border-brand/40 hover:text-brand'
              }`}
            >
              <UserRound className="size-4" aria-hidden />
              {acces.connecte ? (
                <span className="hidden min-[380px]:inline">{acces.libelle}</span>
              ) : (
                // Visiteur : « Espace membres » ne tient qu'à partir de 410 px ; « Connexion » avant.
                <>
                  <span className="hidden min-[380px]:inline min-[410px]:hidden">Connexion</span>
                  <span className="hidden min-[410px]:inline">{acces.libelle}</span>
                </>
              )}
            </Link>

            <a
              href={CLUB.facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden size-10 items-center justify-center rounded-full bg-ink text-white transition-colors hover:bg-brand xl:inline-flex"
              aria-label="Page Facebook du club"
            >
              <FacebookIcon className="size-4" />
            </a>

            {/* Bouton menu mobile */}
            <button
              type="button"
              className="inline-flex size-11 shrink-0 items-center justify-center rounded-full border xl:hidden"
              aria-expanded={ouvert}
              aria-controls="menu-mobile"
              aria-label={ouvert ? 'Fermer le menu' : 'Ouvrir le menu'}
              onClick={() => setOuvert((o) => !o)}
            >
              {ouvert ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </Container>
      </header>

      {/* Menu mobile plein écran — HORS de <header> : le backdrop-filter de l'en-tête ferait de
          celui-ci le repère des éléments `fixed` (panneau de hauteur nulle, liens transparents). */}
      <div
        id="menu-mobile"
        className={`fixed inset-x-0 top-16 bottom-0 z-40 overflow-y-auto bg-white transition-all duration-200 sm:top-18 xl:hidden ${
          ouvert ? 'visible opacity-100' : 'invisible -translate-y-2 opacity-0'
        }`}
      >
        <nav aria-label="Navigation mobile" className="flex min-h-full flex-col px-4 pt-4 pb-8 sm:px-6">
          {navigation.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.to === '/' }}
              className="border-b py-4 text-2xl font-bold tracking-tight"
              activeProps={{ className: 'text-brand' }}
            >
              {item.libelle}
            </Link>
          ))}
          <a
            href={CLUB.facebook}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-auto inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-ink px-6 font-semibold text-white"
          >
            <FacebookIcon /> Suivre le club sur Facebook
          </a>
        </nav>
      </div>
    </>
  )
}
