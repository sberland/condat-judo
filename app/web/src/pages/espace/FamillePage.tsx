import { useState, type FormEvent } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, X } from 'lucide-react'
import { Bloc, Espace } from '../../components/espace/Garde'
import { Alerte, Bouton, Champ } from '../../components/formulaire'
import { age, appel, dateFr, ErreurApi, QUALITES, type Enfant, type Me } from '../../lib/api'
import { CLUB } from '../../content/club'

export function FamillePage() {
  const { data, isPending, isError } = useQuery({
    queryKey: ['famille', 'enfants'],
    queryFn: () => appel<Enfant[]>('GET', '/api/famille/enfants'),
  })

  return (
    <Espace titre="Mes enfants" retour={{ to: '/espace', libelle: 'Mon espace' }}>
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
          <MesCoordonnees me={me} />
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
