import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import type { Route } from './navigation'
import { ArrowUpRight } from 'lucide-react'

export function Container({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 ${className}`}>{children}</div>
}

export function Section({
  id,
  children,
  className = '',
}: {
  id?: string
  children: ReactNode
  className?: string
}) {
  return (
    <section id={id} className={`py-14 sm:py-20 ${className}`}>
      <Container>{children}</Container>
    </section>
  )
}

export function SectionTitle({
  surtitre,
  titre,
  children,
  centre = false,
}: {
  surtitre?: string
  titre: string
  children?: ReactNode
  centre?: boolean
}) {
  return (
    <div className={`mb-8 max-w-2xl sm:mb-12 ${centre ? 'mx-auto text-center' : ''}`}>
      {surtitre && <p className="mb-2 text-sm font-semibold tracking-wider text-brand uppercase">{surtitre}</p>}
      <h2 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl">{titre}</h2>
      {children && <div className="mt-4 text-lg text-muted-foreground">{children}</div>}
    </div>
  )
}

/** En-tête de page intérieure (fond sombre, cohérent avec l'accueil). */
export function PageHeader({ surtitre, titre, children }: { surtitre?: string; titre: string; children?: ReactNode }) {
  return (
    <div className="relative overflow-hidden bg-ink text-white">
      <div className="pointer-events-none absolute -top-24 -right-24 size-72 rounded-full bg-brand/25 blur-3xl" />
      <Container className="relative py-14 sm:py-20">
        {surtitre && <p className="mb-2 text-sm font-semibold tracking-wider text-brand uppercase">{surtitre}</p>}
        <h1 className="text-4xl font-extrabold tracking-tight text-balance sm:text-5xl">{titre}</h1>
        {children && <div className="mt-4 max-w-2xl text-lg text-white/75">{children}</div>}
      </Container>
    </div>
  )
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl border bg-white p-6 shadow-sm ${className}`}>{children}</div>
}

const BOUTONS = {
  primaire: 'bg-brand text-white shadow-sm hover:bg-brand-dark',
  secondaire: 'border border-current/20 bg-white/5 hover:bg-white/10',
  contour: 'border bg-white text-foreground hover:border-brand/40 hover:text-brand',
} as const

type Variante = keyof typeof BOUTONS
const classeBouton = (v: Variante) =>
  `inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 text-base font-semibold transition-colors ${BOUTONS[v]}`

/** Bouton-lien interne (navigation SPA). */
export function BoutonLien({
  to,
  hash,
  variante = 'primaire',
  children,
}: {
  to: Route
  hash?: string
  variante?: Variante
  children: ReactNode
}) {
  return (
    <Link to={to} hash={hash} className={classeBouton(variante)}>
      {children}
    </Link>
  )
}

/** Bouton-lien externe (nouvel onglet). */
export function BoutonExterne({
  href,
  variante = 'primaire',
  children,
}: {
  href: string
  variante?: Variante
  children: ReactNode
}) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={classeBouton(variante)}>
      {children}
      <ArrowUpRight className="size-4 opacity-70" aria-hidden />
    </a>
  )
}

const TONS = {
  ouvert: 'bg-emerald-50 text-emerald-800',
  ferme: 'bg-surface text-muted-foreground',
  annule: 'bg-brand-soft text-brand',
} as const

/** Petite étiquette d'état (ex. « Inscriptions closes »). */
export function Pastille({ ton, className = '', children }: { ton: keyof typeof TONS; className?: string; children: ReactNode }) {
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${TONS[ton]} ${className}`}>{children}</span>
}

export function FacebookIcon({ className = 'size-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.54-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.95.93-1.95 1.88v2.26h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07z" />
    </svg>
  )
}
