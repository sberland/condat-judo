import { useState, type FormEvent } from 'react'
import { Link } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, X } from 'lucide-react'
import { Bloc, Espace } from '../../components/espace/Garde'
import { HistoriqueCompetitions } from '../../components/espace/HistoriqueCompetitions'
import { Alerte, Bouton, Champ } from '../../components/formulaire'
import { age, appel, dateFr, ErreurApi, QUALITES, type Enfant, type Me } from '../../lib/api'
import { CLUB } from '../../content/club'
import { echeancier, LIBELLES_STATUT_PAIEMENT, MODES_ENCAISSEMENT } from '../../content/paiements'
import { Pastille } from '../../components/ui'
import type { MesCotisations as MesCotisationsApi } from '../../lib/paiements'
import { euros } from '../../lib/tarifs'

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
          <MesCotisations />
          <MesCoordonnees me={me} />
          <p className="text-sm text-muted-foreground">
            Ce que le club enregistre sur vous et vos enfants, pour combien de temps, et comment consulter, corriger ou supprimer ces
            informations :{' '}
            <Link to="/donnees-personnelles" className="font-semibold text-brand">
              données personnelles
            </Link>
            .
          </p>
        </div>
      )}
    </Espace>
  )
}

function FicheEnfant({ enfant: e }: { enfant: Enfant }) {
  const droits = [
    ['Vous pouvez l’inscrire (compétitions, garderie)', e.peut_inscrire],
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

      <div className="mt-5 grid gap-4 border-t pt-4 sm:grid-cols-2">
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
        <div>
          <h3 className="mb-1.5 text-sm font-semibold">Autorisés à le récupérer</h3>
          {e.personnesAutorisees.length ? (
            <ul className="grid gap-1">
              {e.personnesAutorisees.map((p) => (
                <li key={`${p.prenom}-${p.nom}`}>
                  {p.prenom} {p.nom} <span className="text-muted-foreground">· {p.lien}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">Personne d’autre que les responsables</p>
          )}
        </div>
      </div>

      <div className="mt-5 border-t pt-4">
        <h3 className="mb-1.5 text-sm font-semibold">Compétitions</h3>
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
                En 3 fois : {echeancier(d).map((v) => `${euros(v.montant)} ${v.date ? `au ${dateFr(v.date)}` : 'à l’inscription'}`).join(', ')}
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
