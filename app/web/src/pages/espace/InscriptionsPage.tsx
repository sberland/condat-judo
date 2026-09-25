import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronRight, UserPlus } from 'lucide-react'
import { Bloc, Espace } from '../../components/espace/Garde'
import { Alerte, Bouton, Champ, Selection } from '../../components/formulaire'
import { formuleParId } from '../../content/adhesion'
import { appel, dateFr, ErreurApi } from '../../lib/api'
import { statutFamille, type AdherentInscription, type Inscriptions } from '../../lib/inscriptions'
import { euros } from '../../lib/tarifs'

// Inscriptions en ligne (spec 010b) : un dossier par adhérent de la famille, pour la saison dont
// le bureau a ouvert les inscriptions ; inscrire un enfant que le club ne connaît pas encore.

export const useInscriptions = () =>
  useQuery({ queryKey: ['famille', 'inscriptions'], queryFn: () => appel<Inscriptions>('GET', '/api/famille/inscriptions') })

const TONS = { a_faire: 'bg-amber-100 text-amber-900', attente: 'bg-sky-100 text-sky-900', ok: 'bg-emerald-100 text-emerald-800' } as const

export function InscriptionsPage() {
  const { data, isPending, isError } = useInscriptions()
  const [ajout, setAjout] = useState(false)
  const saison = data?.saison

  return (
    <Espace titre={saison ? `Inscriptions ${saison.libelle}` : 'Inscriptions'} retour={{ to: '/espace', libelle: 'Mon espace' }} aide="inscriptions">
      {() => (
        <div className="grid gap-6">
          {isPending && <p className="text-muted-foreground">Chargement…</p>}
          {isError && <Alerte>Impossible de charger les inscriptions.</Alerte>}
          {data && !saison && (
            <Bloc titre="Inscriptions pas encore ouvertes">
              <p className="text-muted-foreground">
                Le club n’a pas encore ouvert les inscriptions en ligne de la prochaine saison. Il préviendra les familles dès qu’elles le
                seront.
              </p>
            </Bloc>
          )}
          {saison && data && (
            <>
              <p className="text-muted-foreground">
                Un dossier par adhérent, à remplir depuis votre téléphone en quelques minutes : vos coordonnées sont déjà connues du club.
                Le bureau vérifie ensuite chaque dossier.
              </p>
              {data.adherents.length === 0 ? (
                <p className="rounded-2xl border bg-white p-5 text-muted-foreground">
                  Aucun enfant n’est rattaché à votre compte comme responsable légal. Inscrivez-le ci-dessous, ou demandez au bureau de le
                  rattacher.
                </p>
              ) : (
                <ul className="grid gap-3">
                  {data.adherents.map((a) => (
                    <CarteAdherent key={a.adherent.id} a={a} nomFormule={(id) => formuleParId(saison.tarifs, id)?.nom ?? id} />
                  ))}
                </ul>
              )}
              {ajout ? (
                <NouvelEnfant adresse={data.adherents[0]?.adherent} annuler={() => setAjout(false)} />
              ) : (
                <div>
                  <Bouton variante="secondaire" onClick={() => setAjout(true)}>
                    <UserPlus className="size-4" aria-hidden /> Inscrire un autre enfant
                  </Bouton>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </Espace>
  )
}

function CarteAdherent({ a, nomFormule }: { a: AdherentInscription; nomFormule: (id: string) => string }) {
  const statut = statutFamille(a)
  const d = a.dossier
  const action = !d ? 'Remplir le dossier' : a.modifiable ? 'Modifier' : 'Voir'
  const certificat = d && !d.formalite_recue_le && d.formalite_type === 'certificat'
  return (
    <li>
      <Link
        to="/espace/inscriptions/$id"
        params={{ id: String(a.adherent.id) }}
        className="flex items-center gap-3 rounded-2xl border bg-white p-4 shadow-sm transition hover:border-brand/40 hover:shadow-md"
      >
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-lg font-bold">
              {a.adherent.prenom} {a.adherent.nom}
            </span>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${TONS[statut.ton]}`}>{statut.libelle}</span>
          </span>
          <span className="block text-sm text-muted-foreground">
            {a.moi ? 'Vous-même' : `Né${a.adherent.sexe === 'F' ? 'e' : ''} le ${dateFr(a.adherent.date_naissance)}`}
            {d && ` · ${nomFormule(d.formule)} · ${euros(d.montant_total)}`}
          </span>
          {certificat && <span className="block text-sm font-medium text-amber-800">Certificat médical à remettre au club</span>}
          {a.aVerifier && <span className="block text-sm text-muted-foreground">Nouvel adhérent : le bureau vérifiera sa fiche.</span>}
          <span className="mt-1 block text-sm font-semibold text-brand">{action}</span>
        </span>
        <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden />
      </Link>
    </li>
  )
}

const QUALITES_LEGALES = [
  { valeur: 'mere', libelle: 'Sa mère' },
  { valeur: 'pere', libelle: 'Son père' },
  { valeur: 'tuteur', libelle: 'Son tuteur ou sa tutrice' },
] as const

/** Enfant que le club ne connaît pas encore : sa fiche, puis son dossier. */
function NouvelEnfant({ adresse, annuler }: { adresse?: { adresse: string | null; code_postal: string | null; ville: string | null }; annuler: () => void }) {
  const client = useQueryClient()
  const navigate = useNavigate()
  const [s, setS] = useState({
    prenom: '',
    nom: '',
    date_naissance: '',
    sexe: '' as 'F' | 'M' | '',
    qualite: '' as (typeof QUALITES_LEGALES)[number]['valeur'] | '',
    adresse: adresse?.adresse ?? '',
    code_postal: adresse?.code_postal ?? '',
    ville: adresse?.ville ?? '',
  })
  const [erreurs, setErreurs] = useState<Record<string, string>>({})
  const [message, setMessage] = useState('')
  const [enCours, setEnCours] = useState(false)
  const maj = (champ: keyof typeof s) => (v: string) => setS((p) => ({ ...p, [champ]: v }))

  async function soumettre(e: FormEvent) {
    e.preventDefault()
    setEnCours(true)
    setErreurs({})
    setMessage('')
    try {
      const { id } = await appel<{ id: number }>('POST', '/api/famille/inscriptions/enfants', s)
      await client.invalidateQueries({ queryKey: ['famille'] })
      navigate({ to: '/espace/inscriptions/$id', params: { id: String(id) } })
    } catch (err) {
      if (err instanceof ErreurApi) {
        setErreurs(err.erreurs)
        setMessage(Object.keys(err.erreurs).length ? 'Vérifiez les champs signalés.' : err.message)
      } else setMessage('Enregistrement impossible, réessayez.')
      setEnCours(false)
    }
  }

  return (
    <Bloc titre="Inscrire un autre enfant">
      <form onSubmit={soumettre} className="grid gap-4" noValidate>
        <p className="text-sm text-muted-foreground">
          Pour un enfant que le club ne connaît pas encore. S’il a déjà été inscrit (par un autre parent, une autre année), demandez plutôt
          au bureau de le rattacher à votre compte.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Champ id="enfant-prenom" libelle="Prénom" valeur={s.prenom} onChange={maj('prenom')} erreur={erreurs.prenom} requis />
          <Champ id="enfant-nom" libelle="Nom" valeur={s.nom} onChange={maj('nom')} erreur={erreurs.nom} requis />
          <Champ id="enfant-naissance" libelle="Date de naissance" type="date" valeur={s.date_naissance} onChange={maj('date_naissance')} erreur={erreurs.date_naissance} requis />
          <Selection
            id="enfant-sexe"
            libelle="Sexe"
            valeur={s.sexe}
            options={[
              { valeur: 'F', libelle: 'Fille' },
              { valeur: 'M', libelle: 'Garçon' },
            ]}
            onChange={maj('sexe')}
            erreur={erreurs.sexe}
            requis
          />
          <Selection id="enfant-qualite" libelle="Vous êtes" valeur={s.qualite} options={[...QUALITES_LEGALES]} onChange={maj('qualite')} erreur={erreurs.qualite} requis />
        </div>
        <div className="grid gap-4 sm:grid-cols-[2fr_1fr_1.5fr]">
          <Champ id="enfant-adresse" libelle="Adresse" valeur={s.adresse} onChange={maj('adresse')} erreur={erreurs.adresse} autoComplete="street-address" />
          <Champ id="enfant-cp" libelle="Code postal" valeur={s.code_postal} onChange={maj('code_postal')} erreur={erreurs.code_postal} inputMode="numeric" autoComplete="postal-code" />
          <Champ id="enfant-ville" libelle="Ville" valeur={s.ville} onChange={maj('ville')} erreur={erreurs.ville} autoComplete="address-level2" />
        </div>
        <Alerte>{message}</Alerte>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Bouton type="submit" enCours={enCours}>
            Continuer vers son dossier
          </Bouton>
          <Bouton variante="secondaire" onClick={annuler}>
            Annuler
          </Bouton>
        </div>
      </form>
    </Bloc>
  )
}
