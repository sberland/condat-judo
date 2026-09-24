import { useState, type FormEvent } from 'react'
import { CEINTURES } from '../../content/adhesion'
import { ErreurApi, type Adherent } from '../../lib/api'
import { Alerte, Bouton, Champ, Selection } from '../formulaire'

export type SaisieAdherent = Omit<Adherent, 'id' | 'supprime_le'>

const VIDE: SaisieAdherent = {
  prenom: '',
  nom: '',
  date_naissance: '',
  sexe: 'F',
  grade: '',
  numero_licence: '',
  adresse: '',
  code_postal: '',
  ville: '',
}

/** Formulaire d'adhérent (création ou modification). `enregistrer` lève une ErreurApi en cas de refus. */
export function FormulaireAdherent({
  initial,
  libelleValider,
  enregistrer,
  annuler,
}: {
  initial?: Adherent
  libelleValider: string
  enregistrer: (saisie: SaisieAdherent) => Promise<void>
  annuler?: () => void
}) {
  const [s, setS] = useState<SaisieAdherent>(() =>
    initial
      ? {
          prenom: initial.prenom,
          nom: initial.nom,
          date_naissance: initial.date_naissance,
          sexe: initial.sexe,
          grade: initial.grade ?? '',
          numero_licence: initial.numero_licence ?? '',
          adresse: initial.adresse ?? '',
          code_postal: initial.code_postal ?? '',
          ville: initial.ville ?? '',
        }
      : { ...VIDE, sexe: '' as 'F' },
  )
  const [erreurs, setErreurs] = useState<Record<string, string>>({})
  const [message, setMessage] = useState('')
  const [enCours, setEnCours] = useState(false)
  const maj = (champ: keyof SaisieAdherent) => (v: string) => setS((p) => ({ ...p, [champ]: v }))

  async function soumettre(e: FormEvent) {
    e.preventDefault()
    setEnCours(true)
    setErreurs({})
    setMessage('')
    try {
      await enregistrer(s)
    } catch (err) {
      if (err instanceof ErreurApi) {
        setErreurs(err.erreurs)
        setMessage(Object.keys(err.erreurs).length ? 'Vérifiez les champs signalés.' : err.message)
      } else setMessage('Enregistrement impossible, réessayez.')
    } finally {
      setEnCours(false)
    }
  }

  return (
    <form onSubmit={soumettre} className="grid gap-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Champ id="prenom" libelle="Prénom" requis valeur={s.prenom} onChange={maj('prenom')} erreur={erreurs.prenom} autoComplete="off" />
        <Champ id="nom" libelle="Nom" requis valeur={s.nom} onChange={maj('nom')} erreur={erreurs.nom} autoComplete="off" />
        <Champ
          id="date_naissance"
          libelle="Date de naissance"
          type="date"
          requis
          valeur={s.date_naissance}
          onChange={maj('date_naissance')}
          erreur={erreurs.date_naissance}
        />
        <Selection
          id="sexe"
          libelle="Sexe"
          requis
          valeur={s.sexe}
          options={[
            { valeur: 'F', libelle: 'Féminin' },
            { valeur: 'M', libelle: 'Masculin' },
          ]}
          onChange={(v) => setS((p) => ({ ...p, sexe: v as 'F' | 'M' }))}
          erreur={erreurs.sexe}
        />
        <Selection
          id="grade"
          libelle="Ceinture"
          valeur={s.grade ?? ''}
          // Une valeur saisie avant la liste officielle reste proposée, pour ne pas la perdre.
          options={[...(s.grade && !(CEINTURES as readonly string[]).includes(s.grade) ? [s.grade] : []), ...CEINTURES].map((c) => ({
            valeur: c,
            libelle: c,
          }))}
          onChange={maj('grade')}
          erreur={erreurs.grade}
          vide="Aucune (taïso, yoga, débutant)"
        />
        <Champ
          id="numero_licence"
          libelle="N° de licence France Judo"
          valeur={s.numero_licence ?? ''}
          onChange={maj('numero_licence')}
          erreur={erreurs.numero_licence}
        />
      </div>
      <Champ id="adresse" libelle="Adresse" valeur={s.adresse ?? ''} onChange={maj('adresse')} erreur={erreurs.adresse} autoComplete="off" />
      <div className="grid gap-4 sm:grid-cols-[10rem_1fr]">
        <Champ
          id="code_postal"
          libelle="Code postal"
          inputMode="numeric"
          valeur={s.code_postal ?? ''}
          onChange={maj('code_postal')}
          erreur={erreurs.code_postal}
        />
        <Champ id="ville" libelle="Ville" valeur={s.ville ?? ''} onChange={maj('ville')} erreur={erreurs.ville} />
      </div>
      <Alerte>{message}</Alerte>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Bouton type="submit" enCours={enCours}>
          {libelleValider}
        </Bouton>
        {annuler && (
          <Bouton variante="secondaire" onClick={annuler}>
            Annuler
          </Bouton>
        )}
      </div>
    </form>
  )
}
