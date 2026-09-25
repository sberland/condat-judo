import { useState, type FormEvent } from 'react'
import { Link } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, Download, X } from 'lucide-react'
import { Bloc, Espace } from '../../components/espace/Garde'
import { HistoriqueCompetitions } from '../../components/espace/HistoriqueCompetitions'
import { Alerte, Bouton, Champ } from '../../components/formulaire'
import { age, appel, dateFr, ErreurApi, QUALITES, type Enfant, type Me } from '../../lib/api'
import { CLUB } from '../../content/club'
import { echeancier, LIBELLES_STATUT_PAIEMENT, MODES_ENCAISSEMENT } from '../../content/paiements'
import { Pastille } from '../../components/ui'
import type { MesCotisations as MesCotisationsApi } from '../../lib/paiements'
import { euros } from '../../lib/tarifs'
import { telechargerJson } from '../../lib/csv'
import { ACCORDS, type AccordsFamille } from '../../lib/rgpd'
import { GestionPhoto, PhotoEnfant } from '../../components/espace/Photo'
import { PersonnesAutorisees } from '../../components/espace/PersonnesAutorisees'
import { MesPasskeys } from '../../components/espace/Passkeys'

export function FamillePage() {
  const { data, isPending, isError } = useQuery({
    queryKey: ['famille', 'enfants'],
    queryFn: () => appel<Enfant[]>('GET', '/api/famille/enfants'),
  })

  return (
    <Espace titre="Mes enfants" retour={{ to: '/espace', libelle: 'Mon espace' }} aide="mes-enfants">
      {(me) => (
        <div className="grid gap-6">
          {isPending && <p className="text-muted-foreground">Chargement…</p>}
          {isError && <Alerte>Impossible de charger vos enfants.</Alerte>}
          {data?.length === 0 && (
            <Bloc titre="Aucun enfant rattaché">
              <p className="text-muted-foreground">Le bureau du club rattache les enfants à votre compte lors de l’inscription.</p>
            </Bloc>
          )}
          {data?.map((e) => <FicheEnfant key={e.id} enfant={e} />)}
          {data && data.length > 0 && (
            <p className="text-sm text-muted-foreground">
              Une information à corriger ? Signalez-la au bureau du {CLUB.nom} : il met les fiches à jour.
            </p>
          )}
          <MesAccords />
          <MesCotisations />
          <MesCoordonnees me={me} />
          <MesPasskeys me={me} />
          <MesDonnees />
        </div>
      )}
    </Espace>
  )
}

/** Droit à l'image, groupe WhatsApp (spec 019) et photo pour la garderie (012b) : la famille répond elle-même, oui ou non. */
function MesAccords() {
  const client = useQueryClient()
  const [erreur, setErreur] = useState('')
  const [enCours, setEnCours] = useState('')
  const { data } = useQuery({
    queryKey: ['famille', 'accords'],
    queryFn: () => appel<AccordsFamille>('GET', '/api/famille/accords'),
  })
  if (!data || data.accords.length === 0) return null

  async function repondre(adhesionId: number, accord: keyof typeof ACCORDS, valeur: 'oui' | 'non') {
    setErreur('')
    setEnCours(`${adhesionId}-${accord}`)
    try {
      await appel('PUT', `/api/famille/accords/${adhesionId}`, { accord, valeur })
      // « Non » à la photo l'efface : la fiche de l'enfant est rechargée aussi.
      await client.invalidateQueries({ queryKey: ['famille'] })
    } catch (err) {
      setErreur(err instanceof ErreurApi ? err.message : 'Enregistrement impossible.')
    } finally {
      setEnCours('')
    }
  }

  const LIBELLES: [keyof typeof ACCORDS, string][] = [
    ['droit_image', 'Photos et vidéos'],
    ['whatsapp', 'Groupe WhatsApp du club'],
    ['photo_garderie', 'Photo pour la garderie du mercredi'],
  ]
  // Saison courante et, pendant les inscriptions, saison suivante (010b) : chaque réponse vaut pour sa saison.
  const plusieursSaisons = new Set(data.accords.map((a) => a.saison)).size > 1
  return (
    <Bloc titre={plusieursSaisons ? 'Autorisations' : `Autorisations ${data.saison.libelle}`}>
      <p className="mb-4 text-sm text-muted-foreground">
        Vous pouvez donner ou retirer votre accord à tout moment ; votre réponse est datée et enregistrée à votre nom.
      </p>
      <ul className="grid gap-4">
        {data.accords.map((a) => (
          <li key={a.adhesion_id} className="grid gap-2">
            <p className="font-semibold">
              {a.prenom}
              {plusieursSaisons && <span className="font-normal text-muted-foreground"> · saison {a.saison}</span>}
            </p>
            {LIBELLES.map(([accord, libelle]) => {
              const valeur = a[accord]
              const le = a[`${accord}_le`]
              return (
                <div key={accord} className="flex flex-col gap-2 rounded-xl border p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium">{libelle}</p>
                    <p className="text-sm text-muted-foreground">{ACCORDS[accord]}</p>
                    <p className={`mt-1 text-sm font-semibold ${valeur === 'non_recueilli' ? 'text-amber-800' : ''}`}>
                      {valeur === 'non_recueilli' ? 'Pas encore répondu' : `Réponse : ${valeur === 'oui' ? 'oui' : 'non'}${le ? `, le ${dateFr(le.slice(0, 10))}` : ''}`}
                    </p>
                  </div>
                  <div className="flex gap-2" role="group" aria-label={`${libelle} pour ${a.prenom}`}>
                    {(['oui', 'non'] as const).map((v) => (
                      <button
                        key={v}
                        type="button"
                        aria-pressed={valeur === v}
                        disabled={enCours === `${a.adhesion_id}-${accord}`}
                        onClick={() => valeur !== v && repondre(a.adhesion_id, accord, v)}
                        className="min-h-11 min-w-16 rounded-full border bg-white px-4 text-sm font-semibold disabled:opacity-60 aria-pressed:border-ink aria-pressed:bg-ink aria-pressed:text-white"
                      >
                        {v === 'oui' ? 'Oui' : 'Non'}
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </li>
        ))}
      </ul>
      <div className="mt-3">
        <Alerte>{erreur}</Alerte>
      </div>
    </Bloc>
  )
}

/** Droit d'accès et à la portabilité (spec 019) : tout ce que le club enregistre, en un fichier. */
function MesDonnees() {
  const [enCours, setEnCours] = useState(false)
  const [erreur, setErreur] = useState('')
  return (
    <Bloc titre="Mes données">
      <p className="text-sm text-muted-foreground">
        Tout ce que le club enregistre sur vous et vos enfants, pourquoi et pour combien de temps :{' '}
        <Link to="/donnees-personnelles" className="font-semibold text-brand">
          données personnelles
        </Link>
        . Vous pouvez aussi en télécharger une copie complète.
      </p>
      <div className="mt-4">
        <Bouton
          variante="secondaire"
          enCours={enCours}
          onClick={async () => {
            setEnCours(true)
            setErreur('')
            try {
              const donnees = await appel<unknown>('GET', '/api/famille/export')
              telechargerJson(`mes-donnees-judo-condat-${new Date().toISOString().slice(0, 10)}.json`, donnees)
            } catch {
              setErreur('Téléchargement impossible, réessayez.')
            } finally {
              setEnCours(false)
            }
          }}
        >
          <Download className="size-4" aria-hidden /> Télécharger mes données
        </Bouton>
      </div>
      <div className="mt-3">
        <Alerte>{erreur}</Alerte>
      </div>
    </Bloc>
  )
}

function FicheEnfant({ enfant: e }: { enfant: Enfant }) {
  const client = useQueryClient()
  const rafraichir = () => client.invalidateQueries({ queryKey: ['famille'] })
  const droits = [
    ['Vous pouvez l’inscrire (événements, garderie)', e.peut_inscrire],
    ['Vous pouvez le récupérer', e.peut_recuperer],
    ['Vous êtes prévenu·e par le club', e.est_contact],
  ] as const

  return (
    <Bloc titre={`${e.prenom} ${e.nom}`}>
      <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-3">
        <div>
          <dt className="text-sm text-muted-foreground">Âge</dt>
          <dd className="font-medium">
            {age(e.date_naissance)} ans <span className="font-normal text-muted-foreground">({dateFr(e.date_naissance)})</span>
          </dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Ceinture</dt>
          <dd className="font-medium">{e.grade ?? '—'}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">N° de licence</dt>
          <dd className="font-medium">{e.numero_licence ?? 'en attente'}</dd>
        </div>
      </dl>

      <ul className="mt-5 grid gap-1.5 text-sm">
        {droits.map(([libelle, oui]) => (
          <li key={libelle} className={`flex items-center gap-2 ${oui ? '' : 'text-muted-foreground'}`}>
            {oui ? <Check className="size-4 shrink-0 text-emerald-600" aria-hidden /> : <X className="size-4 shrink-0" aria-hidden />}
            <span>
              {oui ? '' : 'Non : '}
              {libelle}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-5 border-t pt-4">
        <div>
          <h3 className="mb-1.5 text-sm font-semibold">Autres responsables</h3>
          {e.coResponsables.length ? (
            <ul className="grid gap-1">
              {e.coResponsables.map((r) => (
                <li key={`${r.prenom}-${r.nom}`}>
                  {r.prenom} {r.nom} <span className="text-muted-foreground">· {QUALITES[r.qualite]}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">Aucun</p>
          )}
        </div>
      </div>

      <div className="mt-5 border-t pt-4">
        <h3 className="mb-1.5 text-sm font-semibold">Autorisés à le récupérer</h3>
        <p className="mb-3 text-sm text-muted-foreground">
          En plus des responsables : grands-parents, nounou… L’encadrant ne confie l’enfant qu’aux personnes de cette liste.
        </p>
        <PersonnesAutorisees
          base={`/api/famille/enfants/${e.id}/personnes-autorisees`}
          personnes={e.personnesAutorisees}
          modifiable={e.peut_inscrire === 1}
          rafraichir={rafraichir}
          prefixe={`pa-${e.id}`}
        />
      </div>

      <div className="mt-5 border-t pt-4">
        <h3 className="mb-1.5 text-sm font-semibold">Photo pour la garderie du mercredi</h3>
        {e.responsableLegal ? (
          <GestionPhoto prenom={e.prenom} nom={e.nom} etat={e.photo} url={`/api/famille/enfants/${e.id}/photo`} mode="famille" rafraichir={rafraichir} />
        ) : (
          <div className="flex items-center gap-4">
            <PhotoEnfant src={e.photo.deposeeLe ? `/api/famille/enfants/${e.id}/photo?v=${encodeURIComponent(e.photo.deposeeLe)}` : null} prenom={e.prenom} nom={e.nom} />
            <p className="text-sm text-muted-foreground">Seul un responsable légal peut déposer ou retirer la photo.</p>
          </div>
        )}
      </div>

      <div className="mt-5 border-t pt-4">
        <h3 className="mb-1.5 text-sm font-semibold">Événements</h3>
        <HistoriqueCompetitions competitions={e.competitions} vers="public" />
      </div>
    </Bloc>
  )
}

/** Cotisations de la saison (spec 011) : dû, payé, reste, échéances et versements reçus. */
function MesCotisations() {
  const { data } = useQuery({
    queryKey: ['famille', 'paiements'],
    queryFn: () => appel<MesCotisationsApi>('GET', '/api/famille/paiements'),
  })
  if (!data || data.dossiers.length === 0) return null
  return (
    <Bloc titre={`Cotisations ${data.saison.libelle}`}>
      <ul className="grid gap-4">
        {data.dossiers.map((d) => (
          <li key={d.adhesion_id} className="grid gap-1.5">
            <p className="flex flex-wrap items-center gap-2">
              <span className="font-semibold">{d.prenom}</span>
              <Pastille ton={d.statut === 'solde' ? 'ouvert' : d.retard > 0 ? 'annule' : 'ferme'}>{LIBELLES_STATUT_PAIEMENT[d.statut]}</Pastille>
            </p>
            <p className="text-sm">
              {euros(d.montant_total)} · payé {euros(d.paye)}
              {d.restant > 0 && <strong> · reste {euros(d.restant)}</strong>}
            </p>
            {d.paiement_3_fois === 1 && (
              <p className="text-sm text-muted-foreground">
                En 3 fois : {echeancier(d, data.echeances.dates).map((v) => `${euros(v.montant)} ${v.date ? `au ${dateFr(v.date)}` : 'à l’inscription'}`).join(', ')}
              </p>
            )}
            {d.versements.length > 0 && (
              <ul className="text-sm text-muted-foreground">
                {d.versements.map((v, i) => (
                  <li key={i}>
                    {dateFr(v.recu_le)} · {MODES_ENCAISSEMENT[v.mode]} · {euros(v.montant)}
                    {v.encaisser_le && !v.encaisse_le ? ` (encaissé à partir du ${dateFr(v.encaisser_le)})` : ''}
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
      <p className="mt-4 text-sm text-muted-foreground">Une question sur un paiement ? Adressez-vous au trésorier du club.</p>
    </Bloc>
  )
}

function MesCoordonnees({ me }: { me: Me }) {
  const client = useQueryClient()
  const [edition, setEdition] = useState(false)
  const [telephone, setTelephone] = useState(me.telephone ?? '')
  const [erreur, setErreur] = useState('')
  const [enCours, setEnCours] = useState(false)

  async function enregistrer(ev: FormEvent) {
    ev.preventDefault()
    setEnCours(true)
    setErreur('')
    try {
      await appel('PUT', '/api/famille/moi', { telephone })
      await client.invalidateQueries({ queryKey: ['me'] })
      setEdition(false)
    } catch (err) {
      setErreur(err instanceof ErreurApi ? (err.erreurs.telephone ?? err.message) : 'Enregistrement impossible.')
    } finally {
      setEnCours(false)
    }
  }

  return (
    <Bloc
      titre="Mes coordonnées"
      action={
        !edition && (
          <Bouton variante="secondaire" onClick={() => setEdition(true)}>
            Modifier mon téléphone
          </Bouton>
        )
      }
    >
      {edition ? (
        <form onSubmit={enregistrer} className="grid gap-4" noValidate>
          <Champ id="mon-telephone" libelle="Téléphone" type="tel" valeur={telephone} onChange={setTelephone} erreur={erreur} autoComplete="tel" />
          <div className="flex flex-col gap-3 sm:flex-row">
            <Bouton type="submit" enCours={enCours}>
              Enregistrer
            </Bouton>
            <Bouton variante="secondaire" onClick={() => setEdition(false)}>
              Annuler
            </Bouton>
          </div>
        </form>
      ) : (
        <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-muted-foreground">Nom</dt>
            <dd className="font-medium">
              {me.prenom} {me.nom}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">E-mail</dt>
            <dd className="font-medium break-all">{me.email ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Téléphone</dt>
            <dd className="font-medium">{me.telephone ?? '—'}</dd>
          </div>
        </dl>
      )}
    </Bloc>
  )
}
