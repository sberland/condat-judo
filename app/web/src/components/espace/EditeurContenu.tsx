import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'
import { Case, CHAMP, Champ as ChampSaisie, ZoneTexte } from '../formulaire'
import type { Champ, ErreursContenu } from '../../content/contenu'

// Éditeur générique du contenu du site (spec 014) : les champs d'un document sont décrits dans
// content/contenu.ts (même description que la validation du Worker). Erreurs indexées par chemin.

type Objet = Record<string, unknown>

const PETIT = 'inline-flex min-h-10 items-center gap-1.5 rounded-full border bg-white px-3 text-sm font-semibold hover:border-brand/40 hover:text-brand disabled:opacity-40'

export function EditeurChamps({
  champs,
  valeur,
  onChange,
  erreurs,
  chemin = '',
}: {
  champs: Champ[]
  valeur: Objet
  onChange: (v: Objet) => void
  erreurs: ErreursContenu
  chemin?: string
}) {
  return (
    <div className="grid gap-5">
      {champs.map((c) => (
        <EditeurChamp key={c.cle} champ={c} valeur={valeur[c.cle]} onChange={(v) => onChange({ ...valeur, [c.cle]: v })} erreurs={erreurs} chemin={chemin} />
      ))}
    </div>
  )
}

function EditeurChamp({
  champ: c,
  valeur: v,
  onChange,
  erreurs,
  chemin,
}: {
  champ: Champ
  valeur: unknown
  onChange: (v: unknown) => void
  erreurs: ErreursContenu
  chemin: string
}) {
  const ici = `${chemin}${c.cle}`
  const id = `contenu-${ici.replace(/\./g, '-')}`
  const erreur = erreurs[ici]
  switch (c.type) {
    case 'texte':
    case 'url':
    case 'email':
    case 'tel':
      return (
        <ChampSaisie
          id={id}
          libelle={c.libelle}
          aide={c.aide}
          requis={c.requis}
          type={c.type === 'texte' ? 'text' : c.type}
          valeur={typeof v === 'string' ? v : ''}
          onChange={onChange}
          erreur={erreur}
        />
      )
    case 'long':
      return <ZoneTexte id={id} libelle={c.libelle} aide={c.aide} valeur={typeof v === 'string' ? v : ''} onChange={onChange} erreur={erreur} />
    case 'case':
      return <Case id={id} libelle={c.libelle} aide={c.aide} coche={v === true} onChange={(x) => onChange(x || undefined)} />
    case 'cache':
      return null
    case 'textes':
      return <Textes id={id} champ={c} valeur={Array.isArray(v) ? (v as string[]) : []} onChange={onChange} erreur={erreur} />
    case 'objet': {
      const present = v !== undefined && v !== null
      return (
        <fieldset className="grid gap-3 rounded-xl border p-3">
          <legend className="px-1 text-sm font-bold">{c.libelle}</legend>
          {c.aide && <p className="text-sm text-muted-foreground">{c.aide}</p>}
          {present || !c.optionnel ? (
            <EditeurChamps champs={c.champs} valeur={(v ?? {}) as Objet} onChange={onChange} erreurs={erreurs} chemin={`${ici}.`} />
          ) : null}
          {c.optionnel && (
            <div>
              <button type="button" className={PETIT} onClick={() => onChange(present ? undefined : {})}>
                {present ? (
                  <>
                    <Trash2 className="size-4" aria-hidden /> Retirer
                  </>
                ) : (
                  <>
                    <Plus className="size-4" aria-hidden /> Ajouter
                  </>
                )}
              </button>
            </div>
          )}
        </fieldset>
      )
    }
    case 'liste': {
      const elements = Array.isArray(v) ? (v as Objet[]) : []
      const deplacer = (i: number, d: number) => {
        const copie = [...elements]
        const [e] = copie.splice(i, 1)
        if (e) copie.splice(i + d, 0, e)
        onChange(copie)
      }
      return (
        <fieldset className="grid gap-3">
          <legend className="mb-1 font-bold">{c.libelle}</legend>
          {c.aide && <p className="text-sm text-muted-foreground">{c.aide}</p>}
          {erreur && <p className="text-sm font-medium text-brand">{erreur}</p>}
          {elements.map((e, i) => {
            const enErreur = Object.keys(erreurs).some((k) => k.startsWith(`${ici}.${i}.`))
            return (
              <details key={i} open={enErreur || undefined} className="group rounded-xl border bg-white">
                <summary className={`flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 py-2 font-semibold ${enErreur ? 'text-brand' : ''}`}>
                  <span className="min-w-0 truncate">{String(e[c.titre] ?? '') || `(${c.element.replace(/^une? /, '')} sans nom)`}</span>
                  <span className="shrink-0 text-sm font-normal text-muted-foreground group-open:hidden">Modifier</span>
                </summary>
                <div className="grid gap-4 border-t p-4">
                  <EditeurChamps
                    champs={c.champs}
                    valeur={e}
                    onChange={(x) => onChange(elements.map((y, j) => (j === i ? x : y)))}
                    erreurs={erreurs}
                    chemin={`${ici}.${i}.`}
                  />
                  <div className="flex flex-wrap gap-2">
                    <button type="button" className={PETIT} disabled={i === 0} onClick={() => deplacer(i, -1)}>
                      <ArrowUp className="size-4" aria-hidden /> Monter
                    </button>
                    <button type="button" className={PETIT} disabled={i === elements.length - 1} onClick={() => deplacer(i, 1)}>
                      <ArrowDown className="size-4" aria-hidden /> Descendre
                    </button>
                    {!c.fixe && (
                      <button type="button" className={`${PETIT} text-brand`} onClick={() => onChange(elements.filter((_, j) => j !== i))}>
                        <Trash2 className="size-4" aria-hidden /> Retirer
                      </button>
                    )}
                  </div>
                </div>
              </details>
            )
          })}
          {!c.fixe && (
            <div>
              <button type="button" className={PETIT} onClick={() => onChange([...elements, {}])}>
                <Plus className="size-4" aria-hidden /> Ajouter {c.element}
              </button>
            </div>
          )}
        </fieldset>
      )
    }
  }
}

function Textes({
  id,
  champ: c,
  valeur,
  onChange,
  erreur,
}: {
  id: string
  champ: Extract<Champ, { type: 'textes' }>
  valeur: string[]
  onChange: (v: string[]) => void
  erreur?: string
}) {
  return (
    <fieldset className="grid gap-2">
      <legend className="mb-1 text-sm font-semibold">
        {c.libelle}
        {c.requis && <span className="text-brand"> *</span>}
      </legend>
      {valeur.map((t, i) => (
        <div key={i} className="flex items-start gap-2">
          {c.long ? (
            <textarea
              id={`${id}-${i}`}
              aria-label={`${c.libelle} ${i + 1}`}
              rows={3}
              value={t}
              onChange={(e) => onChange(valeur.map((x, j) => (j === i ? e.target.value : x)))}
              className={`${CHAMP} flex-1 py-2.5`}
            />
          ) : (
            <input
              id={`${id}-${i}`}
              aria-label={`${c.libelle} ${i + 1}`}
              value={t}
              onChange={(e) => onChange(valeur.map((x, j) => (j === i ? e.target.value : x)))}
              className={`${CHAMP} flex-1`}
            />
          )}
          <button
            type="button"
            aria-label={`Retirer ${c.element.replace(/^une? /, 'le ')} ${i + 1}`}
            onClick={() => onChange(valeur.filter((_, j) => j !== i))}
            className="flex size-11 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-brand-soft hover:text-brand"
          >
            <Trash2 className="size-4" aria-hidden />
          </button>
        </div>
      ))}
      <div>
        <button type="button" className={PETIT} onClick={() => onChange([...valeur, ''])}>
          <Plus className="size-4" aria-hidden /> Ajouter {c.element}
        </button>
      </div>
      {erreur && <p className="text-sm font-medium text-brand">{erreur}</p>}
    </fieldset>
  )
}
