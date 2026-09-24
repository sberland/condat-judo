import { useState, type FormEvent } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Alerte, Bouton, Champ } from '../formulaire'
import { appel, ErreurApi } from '../../lib/api'

// Personnes sans compte autorisées à récupérer un enfant (grands-parents, nounou…) : gérées par le
// bureau (fiche adhérent) et, depuis la spec 012b, par un responsable qui peut inscrire l'enfant.

type Personne = { id: number; prenom: string; nom: string; lien: string; telephone?: string | null }

const VIDE = { prenom: '', nom: '', lien: '', telephone: '' }

export function PersonnesAutorisees({
  base,
  personnes,
  modifiable,
  rafraichir,
  prefixe,
}: {
  /** POST pour ajouter, DELETE `${base}/:id` pour retirer. */
  base: string
  personnes: Personne[]
  modifiable: boolean
  rafraichir: () => Promise<unknown>
  /** Préfixe des identifiants de champs (plusieurs listes sur une page). */
  prefixe: string
}) {
  const [ajout, setAjout] = useState(false)
  const [s, setS] = useState(VIDE)
  const [erreurs, setErreurs] = useState<Record<string, string>>({})
  const [erreur, setErreur] = useState('')
  const [enCours, setEnCours] = useState(false)

  async function ajouter(e: FormEvent) {
    e.preventDefault()
    setEnCours(true)
    setErreurs({})
    setErreur('')
    try {
      await appel('POST', base, s)
      await rafraichir()
      setS(VIDE)
      setAjout(false)
    } catch (err) {
      if (err instanceof ErreurApi) {
        setErreurs(err.erreurs)
        if (!Object.keys(err.erreurs).length) setErreur(err.message)
      } else setErreur('Enregistrement impossible.')
    } finally {
      setEnCours(false)
    }
  }

  async function retirer(p: Personne) {
    setErreur('')
    try {
      await appel('DELETE', `${base}/${p.id}`)
      await rafraichir()
    } catch (err) {
      setErreur(err instanceof ErreurApi ? err.message : 'Retrait impossible.')
    }
  }

  return (
    <div className="grid gap-3">
      <ul className="grid gap-2">
        {personnes.map((p) => (
          <li key={p.id} className="flex items-center justify-between gap-3 rounded-xl border px-4 py-3">
            <span>
              <span className="font-semibold">
                {p.prenom} {p.nom}
              </span>
              <span className="text-muted-foreground"> · {p.lien}</span>
              {p.telephone && <span className="block text-sm text-muted-foreground">{p.telephone}</span>}
            </span>
            {modifiable && (
              <button
                type="button"
                aria-label={`Retirer ${p.prenom} ${p.nom}`}
                onClick={() => retirer(p)}
                className="flex size-10 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-brand-soft hover:text-brand"
              >
                <Trash2 className="size-4" aria-hidden />
              </button>
            )}
          </li>
        ))}
        {personnes.length === 0 && !ajout && <li className="text-muted-foreground">Personne d’autre que les responsables.</li>}
      </ul>
      {modifiable && !ajout && (
        <div>
          <Bouton variante="secondaire" onClick={() => setAjout(true)}>
            <Plus className="size-4" aria-hidden /> Ajouter une personne
          </Bouton>
        </div>
      )}
      {ajout && (
        <form onSubmit={ajouter} className="grid gap-4 rounded-xl border border-dashed p-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <Champ id={`${prefixe}-prenom`} libelle="Prénom" requis valeur={s.prenom} onChange={(v) => setS((p) => ({ ...p, prenom: v }))} erreur={erreurs.prenom} />
            <Champ id={`${prefixe}-nom`} libelle="Nom" requis valeur={s.nom} onChange={(v) => setS((p) => ({ ...p, nom: v }))} erreur={erreurs.nom} />
            <Champ
              id={`${prefixe}-lien`}
              libelle="Lien avec l’enfant"
              requis
              valeur={s.lien}
              onChange={(v) => setS((p) => ({ ...p, lien: v }))}
              erreur={erreurs.lien}
              aide="Ex. grand-mère, nounou"
            />
            <Champ
              id={`${prefixe}-telephone`}
              libelle="Téléphone"
              type="tel"
              valeur={s.telephone}
              onChange={(v) => setS((p) => ({ ...p, telephone: v }))}
              erreur={erreurs.telephone}
              aide="Pour que l’encadrant puisse la joindre"
            />
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Bouton type="submit" enCours={enCours}>
              Ajouter
            </Bouton>
            <Bouton variante="secondaire" onClick={() => setAjout(false)}>
              Annuler
            </Bouton>
          </div>
        </form>
      )}
      <Alerte>{erreur}</Alerte>
    </div>
  )
}
