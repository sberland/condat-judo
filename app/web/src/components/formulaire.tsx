import type { ReactNode } from 'react'
import { LoaderCircle } from 'lucide-react'

// Composants de formulaire de l'espace connecté : gros champs (mobile), libellé toujours visible,
// message d'erreur de l'API sous le champ concerné.

/** Classe des champs de saisie (partagée avec l'éditeur du contenu du site). */
export const CHAMP =
  'block min-h-12 w-full rounded-xl border bg-white px-3.5 text-base text-foreground outline-none transition-colors focus:border-brand aria-[invalid=true]:border-brand'

export function Champ({
  id,
  libelle,
  erreur,
  aide,
  type = 'text',
  valeur,
  onChange,
  requis = false,
  autoComplete,
  inputMode,
}: {
  id: string
  libelle: string
  erreur?: string
  aide?: string
  type?: 'text' | 'email' | 'tel' | 'date' | 'time' | 'url'
  valeur: string
  onChange: (v: string) => void
  requis?: boolean
  autoComplete?: string
  inputMode?: 'text' | 'numeric' | 'decimal' | 'tel' | 'email' | 'url'
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold">
        {libelle}
        {requis && <span className="text-brand"> *</span>}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        value={valeur}
        onChange={(e) => onChange(e.target.value)}
        required={requis}
        autoComplete={autoComplete}
        inputMode={inputMode}
        aria-invalid={!!erreur}
        aria-describedby={erreur ? `${id}-erreur` : aide ? `${id}-aide` : undefined}
        className={CHAMP}
      />
      {aide && !erreur && (
        <p id={`${id}-aide`} className="mt-1 text-sm text-muted-foreground">
          {aide}
        </p>
      )}
      <MessageChamp id={id} erreur={erreur} />
    </div>
  )
}

/** Texte sur plusieurs lignes (informations pratiques…). */
export function ZoneTexte({
  id,
  libelle,
  erreur,
  aide,
  valeur,
  onChange,
  lignes = 4,
}: {
  id: string
  libelle: string
  erreur?: string
  aide?: string
  valeur: string
  onChange: (v: string) => void
  lignes?: number
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold">
        {libelle}
      </label>
      <textarea
        id={id}
        name={id}
        rows={lignes}
        value={valeur}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={!!erreur}
        aria-describedby={erreur ? `${id}-erreur` : aide ? `${id}-aide` : undefined}
        className={`${CHAMP} py-3`}
      />
      {aide && !erreur && (
        <p id={`${id}-aide`} className="mt-1 text-sm text-muted-foreground">
          {aide}
        </p>
      )}
      <MessageChamp id={id} erreur={erreur} />
    </div>
  )
}

export function Selection<T extends string>({
  id,
  libelle,
  erreur,
  valeur,
  options,
  onChange,
  requis = false,
  vide = 'Choisir…',
}: {
  id: string
  libelle: string
  erreur?: string
  valeur: T | ''
  options: { valeur: T; libelle: string }[]
  onChange: (v: T | '') => void
  requis?: boolean
  /** Libellé de l'option vide (ex. « Aucune »). */
  vide?: string
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold">
        {libelle}
        {requis && <span className="text-brand"> *</span>}
      </label>
      <select
        id={id}
        name={id}
        value={valeur}
        onChange={(e) => onChange(e.target.value as T | '')}
        aria-invalid={!!erreur}
        className={CHAMP}
      >
        <option value="">{vide}</option>
        {options.map((o) => (
          <option key={o.valeur} value={o.valeur}>
            {o.libelle}
          </option>
        ))}
      </select>
      <MessageChamp id={id} erreur={erreur} />
    </div>
  )
}

export function Case({
  id,
  libelle,
  aide,
  coche,
  onChange,
}: {
  id: string
  libelle: string
  aide?: string
  coche: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label htmlFor={id} className="flex min-h-12 cursor-pointer items-start gap-3 rounded-xl border bg-white px-3.5 py-3">
      <input
        id={id}
        type="checkbox"
        checked={coche}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 size-5 shrink-0 accent-brand"
      />
      <span>
        <span className="block font-medium">{libelle}</span>
        {aide && <span className="block text-sm text-muted-foreground">{aide}</span>}
      </span>
    </label>
  )
}

function MessageChamp({ id, erreur }: { id: string; erreur?: string }) {
  if (!erreur) return null
  return (
    <p id={`${id}-erreur`} className="mt-1 text-sm font-medium text-brand">
      {erreur}
    </p>
  )
}

const BOUTONS = {
  primaire: 'bg-brand text-white hover:bg-brand-dark',
  secondaire: 'border bg-white text-foreground hover:border-brand/40 hover:text-brand',
  danger: 'border border-brand/30 bg-white text-brand hover:bg-brand-soft',
} as const

const BOUTON = 'inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-5 font-semibold transition-colors'

/** Lien externe à l'allure d'un bouton (ex. « Envoyer sur WhatsApp »). */
export function LienBouton({ href, children, variante = 'primaire' }: { href: string; children: ReactNode; variante?: keyof typeof BOUTONS }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={`${BOUTON} ${BOUTONS[variante]}`}>
      {children}
    </a>
  )
}

export function Bouton({
  children,
  variante = 'primaire',
  type = 'button',
  enCours = false,
  onClick,
  desactive = false,
}: {
  children: ReactNode
  variante?: keyof typeof BOUTONS
  type?: 'button' | 'submit'
  enCours?: boolean
  onClick?: () => void
  desactive?: boolean
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={enCours || desactive}
      className={`${BOUTON} disabled:opacity-60 ${BOUTONS[variante]}`}
    >
      {enCours && <LoaderCircle className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  )
}

/** Message d'erreur global d'un formulaire ou d'une action. */
export function Alerte({ children }: { children: ReactNode }) {
  if (!children) return null
  return (
    <p role="alert" className="rounded-xl border border-brand/30 bg-brand-soft px-4 py-3 text-sm font-medium text-brand">
      {children}
    </p>
  )
}
