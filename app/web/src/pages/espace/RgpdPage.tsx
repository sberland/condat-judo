import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Bloc, Espace } from '../../components/espace/Garde'
import { Alerte, Champ } from '../../components/formulaire'
import { Pastille } from '../../components/ui'
import { texteConservation } from '../../content/rgpd'
import { appel, dateHeureFr } from '../../lib/api'
import { LIBELLES_ACTION, type AdherentEchu, type EntreeJournal, type EtatRgpd } from '../../lib/rgpd'

const saison = (debut: number) => `${debut}/${debut + 1}`

export function RgpdPage() {
  const { data, isPending, isError } = useQuery({
    queryKey: ['admin', 'rgpd'],
    queryFn: () => appel<EtatRgpd>('GET', '/api/admin/rgpd'),
  })

  return (
    <Espace
      titre="Données personnelles"
      retour={{ to: '/espace', libelle: 'Mon espace' }}
      roles={['admin']}
      aide="rgpd"
      refus="Cette page est réservée à l’administrateur du site."
    >
      {() => {
        if (isPending) return <p className="text-muted-foreground">Chargement…</p>
        if (isError) return <Alerte>Impossible de charger l’état RGPD.</Alerte>
        return (
          <div className="grid grid-cols-1 gap-6">
            <Bloc titre="Durée de conservation" action={<Pastille ton={data.active ? 'ouvert' : 'ferme'}>{data.active ? 'Purge active' : 'Purge inactive'}</Pastille>}>
              <p>
                Adhérents qui ne se réinscrivent pas : <strong>{texteConservation(data.conservation.valeur)}</strong>
                {data.conservation.provisoire && <span className="text-amber-800"> (à confirmer par le club)</span>}.
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {data.active
                  ? 'Chaque lundi, les adhérents arrivés à échéance sont rendus anonymes automatiquement, ainsi que leurs responsables qui n’ont plus d’autre enfant au club.'
                  : data.environnement !== 'production'
                    ? 'La purge automatique ne tourne qu’en production. Ci-dessous : ce qu’elle ferait ici.'
                    : 'La purge automatique attend que le club confirme la durée de conservation.'}
              </p>
              <p className="mt-2 text-sm">
                <Link to="/donnees-personnelles" className="font-semibold text-brand">
                  Page d’information des familles
                </Link>
              </p>
            </Bloc>

            <ListeEchus
              titre={`À la prochaine purge (${data.echus.length})`}
              vide="Aucun adhérent arrivé à échéance."
              adherents={data.echus}
              explication={`Dernière saison en ${saison(data.seuil - 1)} ou avant.`}
            />
            <ListeEchus
              titre={`À la rentrée suivante (${data.saisonSuivante.length})`}
              vide="Aucun adhérent de plus."
              adherents={data.saisonSuivante}
              explication={`Dernière saison en ${saison(data.seuil)}, sans réinscription.`}
            />

            <Bloc titre="Historique des purges">
              {data.purges.length === 0 ? (
                <p className="text-muted-foreground">Aucune purge pour l’instant.</p>
              ) : (
                <ul className="divide-y rounded-xl border text-sm">
                  {data.purges.map((p) => (
                    <li key={p.execute_le} className="px-4 py-2.5">
                      {dateHeureFr(p.execute_le)} · {p.adherents} adhérent{p.adherents > 1 ? 's' : ''} et {p.comptes} compte{p.comptes > 1 ? 's' : ''}{' '}
                      rendus anonymes
                    </li>
                  ))}
                </ul>
              )}
            </Bloc>

            <Journal />
          </div>
        )
      }}
    </Espace>
  )
}

function ListeEchus({ titre, vide, adherents, explication }: { titre: string; vide: string; adherents: AdherentEchu[]; explication: string }) {
  return (
    <Bloc titre={titre}>
      <p className="mb-3 text-sm text-muted-foreground">{explication} Une réinscription (nouveau dossier) les retire de la liste.</p>
      {adherents.length === 0 ? (
        <p className="text-muted-foreground">{vide}</p>
      ) : (
        <ul className="divide-y rounded-xl border">
          {adherents.map((a) => (
            <li key={a.id}>
              <Link
                to="/espace/adherents/$id"
                params={{ id: String(a.id) }}
                className="flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-surface"
              >
                <span className="font-medium">
                  {a.prenom} {a.nom}
                </span>
                <span className="text-sm text-muted-foreground">dernière saison {saison(a.derniere_saison)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Bloc>
  )
}

/** Journal des accès sensibles : qui a consulté ou modifié les coordonnées d'une famille (un an). */
function Journal() {
  const [q, setQ] = useState('')
  const [recherche, setRecherche] = useState('')
  const { data, isPending } = useQuery({
    queryKey: ['admin', 'journal', recherche],
    queryFn: () => appel<EntreeJournal[]>('GET', `/api/admin/journal?q=${encodeURIComponent(recherche)}`),
  })
  return (
    <Bloc titre="Journal des accès">
      <p className="mb-3 text-sm text-muted-foreground">
        Consultations et modifications des coordonnées des familles par le bureau et le trésorier, conservées un an.
      </p>
      <form
        className="mb-3"
        onSubmit={(e) => {
          e.preventDefault()
          setRecherche(q)
        }}
      >
        <Champ id="journal-recherche" libelle="Rechercher (membre du bureau, famille, adhérent)" valeur={q} onChange={setQ} />
      </form>
      {isPending && <p className="text-muted-foreground">Chargement…</p>}
      {data && data.length === 0 && <p className="text-muted-foreground">Aucune entrée.</p>}
      {data && data.length > 0 && (
        <ul className="divide-y rounded-xl border text-sm">
          {data.map((e) => (
            <li key={e.id} className="px-4 py-2.5">
              <span className="text-muted-foreground">{dateHeureFr(e.cree_le)} · </span>
              <strong>{e.acteur ?? 'Compte supprimé'}</strong> {LIBELLES_ACTION[e.action]} <strong>{e.cible_libelle ?? 'une fiche supprimée'}</strong>
              {e.detail && <span className="text-muted-foreground"> ({e.detail})</span>}
            </li>
          ))}
        </ul>
      )}
    </Bloc>
  )
}
