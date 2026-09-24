import { useState, type FormEvent } from 'react'
import { CATEGORIES, libelleCategorie } from '../../content/categories'
import { appel, ErreurApi } from '../../lib/api'
import { LIBELLES_STATUT_COMPETITION, type Competition, type StatutCompetition } from '../../lib/competitions'
import { Alerte, Bouton, Champ, Selection, ZoneTexte } from '../formulaire'

type Saisie = {
  nom: string
  date: string
  lieu: string
  adresse: string
  lien_officiel: string
  infos: string
  categories: string[]
  sexe: 'F' | 'M' | ''
  date_limite: string
  statut: StatutCompetition
}

const vide: Saisie = {
  nom: '',
  date: '',
  lieu: '',
  adresse: '',
  lien_officiel: '',
  infos: '',
  categories: [],
  sexe: '',
  date_limite: '',
  statut: 'ouverte',
}

const depuis = (c: Competition): Saisie => ({
  ...c,
  adresse: c.adresse ?? '',
  lien_officiel: c.lien_officiel ?? '',
  infos: c.infos ?? '',
  sexe: c.sexe ?? '',
})

/**
 * Création (`competition` absente) ou modification d'une compétition. Le statut ne se choisit
 * qu'en modification : une compétition naît « ouverte ».
 */
export function FormulaireCompetition({
  competition,
  onEnregistre,
  onAnnule,
}: {
  competition?: Competition
  onEnregistre: (id: number) => void
  onAnnule: () => void
}) {
  const [s, setS] = useState<Saisie>(competition ? depuis(competition) : vide)
  const [erreurs, setErreurs] = useState<Record<string, string>>({})
  const [erreur, setErreur] = useState('')
  const [enCours, setEnCours] = useState(false)
  const maj = <K extends keyof Saisie>(k: K) => (v: Saisie[K]) => setS((p) => ({ ...p, [k]: v }))
  const p = competition ? `competition-${competition.id}` : 'competition-nouvelle'

  function basculer(id: string) {
    setS((prec) => ({
      ...prec,
      categories: prec.categories.includes(id) ? prec.categories.filter((c) => c !== id) : [...prec.categories, id],
    }))
  }

  async function enregistrer(ev: FormEvent) {
    ev.preventDefault()
    setEnCours(true)
    setErreurs({})
    setErreur('')
    try {
      const corps = { ...s, sexe: s.sexe || null }
      if (competition) {
        await appel('PUT', `/api/admin/competitions/${competition.id}`, corps)
        onEnregistre(competition.id)
      } else {
        const r = await appel<{ id: number }>('POST', '/api/admin/competitions', corps)
        onEnregistre(r.id)
      }
    } catch (err) {
      if (err instanceof ErreurApi) {
        setErreurs(err.erreurs)
        setErreur(Object.keys(err.erreurs).length ? 'Vérifiez les champs signalés.' : err.message)
      } else setErreur('Enregistrement impossible.')
    } finally {
      setEnCours(false)
    }
  }

  return (
    <form onSubmit={enregistrer} className="grid gap-4" noValidate>
      <Champ id={`${p}-nom`} libelle="Nom de la compétition" valeur={s.nom} onChange={maj('nom')} erreur={erreurs.nom} requis />
      <div className="grid gap-4 sm:grid-cols-2">
        <Champ id={`${p}-date`} libelle="Date" type="date" valeur={s.date} onChange={maj('date')} erreur={erreurs.date} requis />
        <Champ
          id={`${p}-limite`}
          libelle="Date limite d’inscription"
          type="date"
          valeur={s.date_limite}
          onChange={maj('date_limite')}
          erreur={erreurs.date_limite}
          aide="Les parents peuvent inscrire jusqu’à ce jour inclus."
          requis
        />
      </div>
      <Champ id={`${p}-lieu`} libelle="Lieu" valeur={s.lieu} onChange={maj('lieu')} erreur={erreurs.lieu} aide="Ville, salle." requis />
      <Champ
        id={`${p}-adresse`}
        libelle="Adresse"
        valeur={s.adresse}
        onChange={maj('adresse')}
        erreur={erreurs.adresse}
        aide="Pour le bouton « Itinéraire » (sinon le lieu est utilisé)."
      />

      <fieldset>
        <legend className="mb-1.5 text-sm font-semibold">
          Catégories <span className="text-brand">*</span>
        </legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {CATEGORIES.map((c) => (
            <label key={c.id} htmlFor={`${p}-cat-${c.id}`} className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border bg-white px-3.5">
              <input
                id={`${p}-cat-${c.id}`}
                type="checkbox"
                checked={s.categories.includes(c.id)}
                onChange={() => basculer(c.id)}
                className="size-5 shrink-0 accent-brand"
              />
              <span>{libelleCategorie(c)}</span>
            </label>
          ))}
        </div>
        {erreurs.categories && <p className="mt-1 text-sm font-medium text-brand">{erreurs.categories}</p>}
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <Selection
          id={`${p}-sexe`}
          libelle="Ouverte à"
          valeur={s.sexe}
          options={[
            { valeur: 'F', libelle: 'Filles seulement' },
            { valeur: 'M', libelle: 'Garçons seulement' },
          ]}
          onChange={maj('sexe')}
          vide="Filles et garçons"
          erreur={erreurs.sexe}
        />
        {competition && (
          <Selection
            id={`${p}-statut`}
            libelle="Statut"
            valeur={s.statut}
            options={(Object.keys(LIBELLES_STATUT_COMPETITION) as StatutCompetition[]).map((v) => ({ valeur: v, libelle: LIBELLES_STATUT_COMPETITION[v] }))}
            onChange={(v) => v && maj('statut')(v)}
            erreur={erreurs.statut}
          />
        )}
      </div>

      <ZoneTexte
        id={`${p}-infos`}
        libelle="Informations pratiques"
        valeur={s.infos}
        onChange={maj('infos')}
        erreur={erreurs.infos}
        aide="Pesée, horaires, pièces à apporter… Visible par tous sur la page de la compétition."
      />
      <Champ
        id={`${p}-lien`}
        libelle="Page officielle"
        type="url"
        inputMode="url"
        valeur={s.lien_officiel}
        onChange={maj('lien_officiel')}
        erreur={erreurs.lien_officiel}
        aide="Lien vers la page de l’organisateur ou de la fédération (facultatif)."
      />

      <Alerte>{erreur}</Alerte>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Bouton type="submit" enCours={enCours}>
          {competition ? 'Enregistrer' : 'Créer la compétition'}
        </Bouton>
        <Bouton variante="secondaire" onClick={onAnnule}>
          Annuler
        </Bouton>
      </div>
    </form>
  )
}
