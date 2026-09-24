import { useState, type FormEvent, type ReactNode } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { CircleCheck, Pencil, Trash2, UserPlus } from 'lucide-react'
import {
  calculerMontant,
  FORMALITES,
  formuleParId,
  LIBELLES_STATUT,
  MODES_PAIEMENT,
  passeportPossible,
  RECUEILS,
  type EtatDossier,
  type Formalite,
  type ModePaiement,
  type Recueil,
} from '../../content/adhesion'
import { TARIFS } from '../../content/tarifs'
import { appel, dateFr, ErreurApi, type Adhesion, type DossierAdhesion } from '../../lib/api'
import { euros } from '../../lib/tarifs'
import { Alerte, Bouton, Case, Champ, Selection } from '../formulaire'
import { Bloc } from './Garde'

// Dossier d'adhésion de la saison (spec 010a), sur la fiche d'un adhérent : résumé, saisie,
// validation. Le serveur recalcule et fige les montants ; l'écran en affiche une estimation.

type Saisie = {
  formule: string
  passeport: boolean
  hors_commune: boolean
  reduction_famille: boolean
  paiement_mode: ModePaiement | ''
  paiement_3_fois: boolean
  formalite_type: Formalite | ''
  formalite_recue_le: string
  soins_urgence: Recueil
  droit_image: Recueil
  whatsapp: Recueil
}

const COULEURS_STATUT: Record<EtatDossier['statut'], string> = {
  a_completer: 'bg-amber-100 text-amber-900',
  complet: 'bg-sky-100 text-sky-900',
  valide: 'bg-emerald-100 text-emerald-800',
}

export function StatutDossier({ etat }: { etat: EtatDossier | null }) {
  if (!etat) return <span className="rounded-full bg-surface px-2.5 py-1 text-xs font-semibold text-muted-foreground">Sans dossier</span>
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${COULEURS_STATUT[etat.statut]}`}>{LIBELLES_STATUT[etat.statut]}</span>
}

export function BlocAdhesion({ adherentId }: { adherentId: number }) {
  const client = useQueryClient()
  const navigate = useNavigate()
  const url = `/api/admin/adherents/${adherentId}/adhesion`
  const cle = ['admin', 'adhesion', adherentId]
  const { data, isError } = useQuery({ queryKey: cle, queryFn: () => appel<DossierAdhesion>('GET', url) })
  const [edition, setEdition] = useState(false)
  const [enregistre, setEnregistre] = useState(false)
  const [confirmer, setConfirmer] = useState(false)
  const [message, setMessage] = useState('')

  const mettreAJour = async (d: DossierAdhesion | null) => {
    if (d) client.setQueryData(cle, d)
    await client.invalidateQueries({ queryKey: ['admin'] })
  }

  if (isError) return <Alerte>Impossible de charger le dossier d’adhésion.</Alerte>
  if (!data) return null
  const titre = `Adhésion ${data.saison.libelle}`

  if (edition) {
    return (
      <Bloc titre={titre}>
        <FormulaireAdhesion
          dossier={data}
          annuler={() => setEdition(false)}
          enregistrer={async (s) => {
            await mettreAJour(await appel<DossierAdhesion>('PUT', url, s))
            setEdition(false)
            setEnregistre(true)
          }}
        />
      </Bloc>
    )
  }

  const a = data.adhesion
  if (!a) {
    return (
      <Bloc titre={titre} action={<StatutDossier etat={null} />}>
        <p className="mb-4 text-muted-foreground">Pas encore de dossier pour cette saison.</p>
        <Bouton onClick={() => setEdition(true)}>Saisir le dossier</Bouton>
      </Bloc>
    )
  }

  return (
    <Bloc titre={titre} action={<StatutDossier etat={data.etat} />}>
      <div id="adhesion" className="grid gap-4">
        {enregistre && (
          <div className="flex flex-col gap-3 rounded-xl bg-emerald-50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-center gap-2 font-semibold text-emerald-800">
              <CircleCheck className="size-5" aria-hidden /> Dossier enregistré
            </p>
            <Bouton variante="secondaire" onClick={() => navigate({ to: '/espace/adherents/nouveau' })}>
              <UserPlus className="size-4" aria-hidden /> Saisir l’adhérent suivant
            </Bouton>
          </div>
        )}
        {data.etat && data.etat.manques.length > 0 && <Alerte>À compléter : {data.etat.manques.join(', ')}.</Alerte>}
        {data.etat && data.etat.aRecueillir.length > 0 && (
          <p className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            À recueillir auprès de la famille : {data.etat.aRecueillir.join(', ')}.
          </p>
        )}
        <Resume a={a} mineur={data.contexte.mineur} />
        <Alerte>{message}</Alerte>
        <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row">
          <Bouton variante="secondaire" onClick={() => setEdition(true)}>
            <Pencil className="size-4" aria-hidden /> Modifier
          </Bouton>
          {data.etat?.statut === 'complet' && (
            <Bouton
              onClick={async () => {
                setMessage('')
                try {
                  await mettreAJour(await appel<DossierAdhesion>('POST', `${url}/valider`))
                } catch (err) {
                  setMessage(err instanceof ErreurApi ? err.message : 'Validation impossible.')
                }
              }}
            >
              <CircleCheck className="size-4" aria-hidden /> Valider le dossier
            </Bouton>
          )}
        </div>
        {a.valide_le && <p className="text-sm text-muted-foreground">Validé par le bureau le {dateFr(a.valide_le.slice(0, 10))}.</p>}
        {confirmer ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <span className="text-sm">Supprimer ce dossier ?</span>
            <Bouton
              variante="danger"
              onClick={async () => {
                await appel('DELETE', url)
                await mettreAJour(null)
                setConfirmer(false)
              }}
            >
              Confirmer
            </Bouton>
            <Bouton variante="secondaire" onClick={() => setConfirmer(false)}>
              Annuler
            </Bouton>
          </div>
        ) : (
          <button type="button" onClick={() => setConfirmer(true)} className="inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-brand">
            <Trash2 className="size-4" aria-hidden /> Supprimer le dossier
          </button>
        )}
      </div>
    </Bloc>
  )
}

function Ligne({ libelle, children }: { libelle: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-sm text-muted-foreground">{libelle}</dt>
      <dd className="font-medium">{children}</dd>
    </div>
  )
}

function Resume({ a, mineur }: { a: Adhesion; mineur: boolean }) {
  const f = formuleParId(a.formule)
  const options = [a.passeport && 'passeport', a.hors_commune && 'hors commune', a.reduction_famille && 'réduction famille'].filter(Boolean)
  return (
    <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
      <Ligne libelle="Formule">
        {f?.nom ?? a.formule}
        {options.length > 0 && <span className="font-normal text-muted-foreground"> · {options.join(', ')}</span>}
      </Ligne>
      <Ligne libelle="Montant">
        {euros(a.montant_total)}
        <span className="block text-sm font-normal text-muted-foreground">
          {euros(a.montant_participation)} + licence {euros(a.montant_licence)}
          {a.montant_supplements > 0 && ` + ${euros(a.montant_supplements)}`}
          {a.montant_reduction > 0 && ` − ${euros(a.montant_reduction)}`}
        </span>
      </Ligne>
      <Ligne libelle="Paiement">
        {a.paiement_mode ? MODES_PAIEMENT[a.paiement_mode] : <span className="text-brand">à préciser</span>}
        {a.paiement_3_fois === 1 && (
          <span className="block text-sm font-normal text-muted-foreground">
            En 3 fois : {euros(a.echeance_1)}, {euros(a.echeance_2)}, {euros(a.echeance_3)}
          </span>
        )}
      </Ligne>
      <Ligne libelle="Formalité médicale">
        {a.formalite_recue_le ? (
          <>
            {a.formalite_type ? FORMALITES[a.formalite_type] : 'Pièce'} — reçue le {dateFr(a.formalite_recue_le)}
          </>
        ) : (
          <span className="text-brand">non reçue</span>
        )}
      </Ligne>
      {mineur && <Ligne libelle="Soins d’urgence">{RECUEILS[a.soins_urgence]}</Ligne>}
      <Ligne libelle="Droit à l’image">{RECUEILS[a.droit_image]}</Ligne>
      <Ligne libelle="Groupe WhatsApp">{RECUEILS[a.whatsapp]}</Ligne>
    </dl>
  )
}

function ChoixRecueil({ id, libelle, aide, valeur, onChange }: { id: string; libelle: string; aide?: string; valeur: Recueil; onChange: (v: Recueil) => void }) {
  return (
    <fieldset>
      <legend className="mb-1.5 text-sm font-semibold">{libelle}</legend>
      {aide && <p className="mb-2 text-sm text-muted-foreground">{aide}</p>}
      <div className="grid grid-cols-3 gap-2">
        {(Object.keys(RECUEILS) as Recueil[]).map((r) => (
          <label
            key={r}
            className={`flex min-h-12 cursor-pointer items-center justify-center rounded-xl border px-2 text-center text-sm font-semibold transition-colors ${
              valeur === r ? 'border-ink bg-ink text-white' : 'bg-white hover:border-brand/40'
            }`}
          >
            <input type="radio" name={id} value={r} checked={valeur === r} onChange={() => onChange(r)} className="sr-only" />
            {RECUEILS[r]}
          </label>
        ))}
      </div>
    </fieldset>
  )
}

function FormulaireAdhesion({
  dossier,
  enregistrer,
  annuler,
}: {
  dossier: DossierAdhesion
  enregistrer: (s: Saisie) => Promise<void>
  annuler: () => void
}) {
  const { contexte, adhesion: a } = dossier
  // Nouveau dossier : formule judo d'après l'âge, hors commune d'après l'adresse, réduction famille
  // si un frère ou une sœur a déjà un dossier — tout reste modifiable.
  const [s, setS] = useState<Saisie>(() => ({
    formule: a?.formule ?? contexte.formuleJudo,
    passeport: a ? a.passeport === 1 : false,
    hors_commune: a ? a.hors_commune === 1 : contexte.horsCommune,
    reduction_famille: a ? a.reduction_famille === 1 : contexte.autresDossiersFamille > 0,
    paiement_mode: a?.paiement_mode ?? '',
    paiement_3_fois: a ? a.paiement_3_fois === 1 : false,
    formalite_type: a?.formalite_type ?? (contexte.mineur ? 'attestation_qs_mineur' : ''),
    formalite_recue_le: a?.formalite_recue_le ?? '',
    soins_urgence: a?.soins_urgence ?? 'non_recueilli',
    droit_image: a?.droit_image ?? 'non_recueilli',
    whatsapp: a?.whatsapp ?? 'non_recueilli',
  }))
  const [erreurs, setErreurs] = useState<Record<string, string>>({})
  const [message, setMessage] = useState('')
  const [enCours, setEnCours] = useState(false)
  const maj = <K extends keyof Saisie>(champ: K) => (v: Saisie[K]) => setS((p) => ({ ...p, [champ]: v }))
  const montant = calculerMontant({ formule: s.formule, passeport: s.passeport, horsCommune: s.hors_commune, reductionFamille: s.reduction_famille })

  async function soumettre(e: FormEvent) {
    e.preventDefault()
    setEnCours(true)
    setErreurs({})
    setMessage('')
    try {
      await enregistrer({ ...s, passeport: s.passeport && passeportPossible(s.formule) })
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
    <form onSubmit={soumettre} className="grid gap-6" noValidate>
      <fieldset className="grid gap-3">
        <legend className="mb-1 font-bold">Formule</legend>
        {TARIFS.groupes.map((g) => (
          <div key={g.titre} className="grid gap-2">
            <p className="text-sm font-semibold text-muted-foreground">{g.titre}</p>
            {g.formules.map((f) => (
              <label
                key={f.id}
                className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-2.5 ${s.formule === f.id ? 'border-ink ring-1 ring-ink' : 'bg-white'}`}
              >
                <input type="radio" name="formule" value={f.id} checked={s.formule === f.id} onChange={() => maj('formule')(f.id)} className="size-5 accent-brand" />
                <span className="flex-1">
                  <span className="block font-medium">
                    {f.nom}
                    {f.id === contexte.formuleJudo && <span className="ml-2 rounded-full bg-brand-soft px-2 py-0.5 text-xs font-semibold text-brand">d’après l’âge</span>}
                  </span>
                  <span className="block text-sm text-muted-foreground">{f.public}</span>
                </span>
                <span className="font-semibold">{euros(f.participation + f.licence)}</span>
              </label>
            ))}
          </div>
        ))}
        {erreurs.formule && <p className="text-sm font-medium text-brand">{erreurs.formule}</p>}
      </fieldset>

      <fieldset className="grid gap-2">
        <legend className="mb-1 font-bold">Suppléments et réduction</legend>
        {passeportPossible(s.formule) && (
          <Case id="passeport" libelle="Passeport sportif (+8 €)" aide="Recommandé pour les compétiteurs" coche={s.passeport} onChange={maj('passeport')} />
        )}
        <Case
          id="hors_commune"
          libelle="Résident hors commune (+2 €)"
          aide={contexte.horsCommune ? 'L’adresse de l’adhérent est hors de Condat-sur-Vienne' : undefined}
          coche={s.hors_commune}
          onChange={maj('hors_commune')}
        />
        <Case
          id="reduction_famille"
          libelle="Réduction famille (−8 €)"
          aide={
            contexte.autresDossiersFamille > 0
              ? `2ᵉ licence : ${contexte.autresDossiersFamille} autre${contexte.autresDossiersFamille > 1 ? 's' : ''} enfant${contexte.autresDossiersFamille > 1 ? 's' : ''} de la famille déjà inscrit${contexte.autresDossiersFamille > 1 ? 's' : ''}`
              : 'Sur la 2ᵉ licence d’une même famille'
          }
          coche={s.reduction_famille}
          onChange={maj('reduction_famille')}
        />
      </fieldset>

      {montant && (
        <div className="rounded-xl bg-surface p-4">
          <p className="flex items-baseline justify-between gap-3">
            <span className="font-bold">Total</span>
            <span className="text-2xl font-extrabold">{euros(montant.total)}</span>
          </p>
          <p className="text-sm text-muted-foreground">
            {euros(montant.participation)} + licence {euros(montant.licence)}
            {montant.supplements > 0 && ` + ${euros(montant.supplements)}`}
            {montant.reduction > 0 && ` − ${euros(montant.reduction)}`}
            {s.paiement_3_fois && ` · en 3 fois : ${montant.echeancier.map(euros).join(', ')}`}
          </p>
        </div>
      )}

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-1 font-bold">Paiement</legend>
        <Selection
          id="paiement_mode"
          libelle="Mode de paiement"
          valeur={s.paiement_mode}
          options={(Object.keys(MODES_PAIEMENT) as ModePaiement[]).map((m) => ({ valeur: m, libelle: MODES_PAIEMENT[m] }))}
          onChange={maj('paiement_mode')}
          erreur={erreurs.paiement_mode}
          vide="À préciser"
        />
        <div className="sm:pt-7">
          <Case id="paiement_3_fois" libelle="Paiement en 3 fois" coche={s.paiement_3_fois} onChange={maj('paiement_3_fois')} />
        </div>
      </fieldset>

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-1 font-bold">Formalité médicale</legend>
        <p className="text-sm text-muted-foreground sm:col-span-2">On note seulement la pièce reçue et sa date — jamais son contenu.</p>
        <Selection
          id="formalite_type"
          libelle="Pièce"
          valeur={s.formalite_type}
          options={(Object.keys(FORMALITES) as Formalite[]).map((f) => ({ valeur: f, libelle: FORMALITES[f] }))}
          onChange={maj('formalite_type')}
          erreur={erreurs.formalite_type}
        />
        <Champ id="formalite_recue_le" libelle="Reçue le" type="date" valeur={s.formalite_recue_le} onChange={maj('formalite_recue_le')} erreur={erreurs.formalite_recue_le} />
      </fieldset>

      <fieldset className="grid gap-4">
        <legend className="mb-1 font-bold">Autorisations et consentements</legend>
        {contexte.mineur && (
          <ChoixRecueil id="soins_urgence" libelle="Soins d’urgence" aide="Autorisation d’hospitalisation ou d’intervention en cas d’urgence" valeur={s.soins_urgence} onChange={maj('soins_urgence')} />
        )}
        <ChoixRecueil
          id="droit_image"
          libelle="Droit à l’image"
          aide="Le papier le disait « accepté par l’inscription » : non valable. Oui ou non seulement sur accord explicite."
          valeur={s.droit_image}
          onChange={maj('droit_image')}
        />
        <ChoixRecueil id="whatsapp" libelle="Groupe WhatsApp du club" aide="Tel que coché sur le formulaire" valeur={s.whatsapp} onChange={maj('whatsapp')} />
      </fieldset>

      <Alerte>{message}</Alerte>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Bouton type="submit" enCours={enCours}>
          Enregistrer le dossier
        </Bouton>
        <Bouton variante="secondaire" onClick={annuler}>
          Annuler
        </Bouton>
      </div>
    </form>
  )
}
