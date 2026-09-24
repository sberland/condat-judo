import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, Repeat } from 'lucide-react'
import { Bloc, Espace } from '../../components/espace/Garde'
import { Alerte, Bouton, Selection } from '../../components/formulaire'
import { appel, ErreurApi } from '../../lib/api'
import { jourLong, majuscule, type GarderieFamille } from '../../lib/garderie'

// Garderie du mercredi (spec 012a) : le responsable demande (ou annule) la récupération de ses
// enfants, mercredi par mercredi ou pour toute une période.

const VISIBLES = 8

export function GarderiePage() {
  const { data, isPending, isError } = useQuery({
    queryKey: ['famille', 'garderie'],
    queryFn: () => appel<GarderieFamille>('GET', '/api/famille/garderie'),
  })

  return (
    <Espace titre="Garderie du mercredi" retour={{ to: '/espace', libelle: 'Mon espace' }} aide="garderie">
      {() => {
        if (isPending) return <p className="text-muted-foreground">Chargement…</p>
        if (isError) return <Alerte>Impossible de charger la garderie.</Alerte>
        const g = data.garderie
        if (!g.ouverte)
          return (
            <Bloc titre="Bientôt sur le site">
              <p className="text-muted-foreground">
                Les demandes de garderie du mercredi ouvriront bientôt ici. En attendant, continuez comme d’habitude avec le club.
              </p>
            </Bloc>
          )
        const avecDroit = data.enfants.filter((e) => e.peutInscrire)
        const sansDroit = data.enfants.filter((e) => !e.peutInscrire)
        return (
          <div className="grid grid-cols-1 gap-6">
            <p className="text-muted-foreground">
              Le club récupère votre enfant le mercredi pour le goûter et le cours
              {g.lieux.length === 1 ? ` (lieu de récupération : ${g.lieux[0]})` : ''}. Demande ou annulation jusqu’à{' '}
              <strong className="text-foreground">{g.limite}</strong> ; ensuite, contactez le bureau.
              {g.provisoire && <span className="text-amber-800"> (Réglages à confirmer par le club.)</span>}
            </p>
            {data.enfants.length === 0 && <Alerte>Aucun enfant n’est rattaché à votre compte.</Alerte>}
            {data.mercredis.length === 0 && data.enfants.length > 0 && <p className="text-muted-foreground">Plus de mercredi de garderie cette saison.</p>}
            {avecDroit.map((e) => (
              <Enfant key={e.id} enfant={e} donnees={data} />
            ))}
            {sansDroit.map((e) => (
              <Bloc key={e.id} titre={e.prenom}>
                <p className="text-sm text-muted-foreground">Les demandes pour {e.prenom} sont faites par un autre responsable.</p>
                {e.demandes.length > 0 && (
                  <ul className="mt-2 grid gap-1 text-sm">
                    {e.demandes.map((d) => (
                      <li key={d.date}>
                        {majuscule(jourLong(d.date))} · {d.lieu}
                      </li>
                    ))}
                  </ul>
                )}
              </Bloc>
            ))}
          </div>
        )
      }}
    </Espace>
  )
}

function Enfant({ enfant: e, donnees }: { enfant: GarderieFamille['enfants'][number]; donnees: GarderieFamille }) {
  const client = useQueryClient()
  const g = donnees.garderie
  const [tous, setTous] = useState(false)
  // Lieu proposé : celui de la dernière demande, sinon le premier.
  const [lieu, setLieu] = useState(e.demandes.at(-1)?.lieu ?? g.lieux[0] ?? '')
  const modifiables = donnees.mercredis.filter((m) => m.modifiable)
  const [jusquau, setJusquau] = useState(modifiables.at(-1)?.date ?? g.fin)
  const [enCours, setEnCours] = useState('')
  const [erreur, setErreur] = useState('')
  const [message, setMessage] = useState('')
  const demande = (date: string) => e.demandes.find((d) => d.date === date)

  async function agir(cle: string, action: () => Promise<unknown>, succes = '') {
    setEnCours(cle)
    setErreur('')
    setMessage('')
    try {
      await action()
      await client.invalidateQueries({ queryKey: ['famille', 'garderie'] })
      setMessage(succes)
    } catch (err) {
      setErreur(err instanceof ErreurApi ? err.message : 'Action impossible, réessayez.')
    } finally {
      setEnCours('')
    }
  }

  const visibles = tous ? donnees.mercredis : donnees.mercredis.slice(0, VISIBLES)
  return (
    <Bloc titre={e.prenom}>
      <div className="grid gap-4">
        {g.lieux.length > 1 && (
          <Selection
            id={`garderie-${e.id}-lieu`}
            libelle="Lieu de récupération"
            valeur={lieu}
            options={g.lieux.map((l) => ({ valeur: l, libelle: l }))}
            onChange={(v) => v && setLieu(v)}
          />
        )}

        {modifiables.length > 1 && (
          <div className="grid gap-3 rounded-xl bg-surface p-3 sm:grid-cols-[1fr_auto] sm:items-end">
            <Selection
              id={`garderie-${e.id}-jusquau`}
              libelle="Tous les mercredis jusqu’au"
              valeur={jusquau}
              options={modifiables.map((m) => ({ valeur: m.date, libelle: jourLong(m.date) }))}
              onChange={(v) => v && setJusquau(v)}
            />
            <Bouton
              variante="secondaire"
              enCours={enCours === 'serie'}
              onClick={() =>
                agir(
                  'serie',
                  () => appel('POST', `/api/famille/garderie/${e.id}/serie`, { jusquau, lieu }),
                  `Demandé pour tous les mercredis jusqu’au ${jourLong(jusquau)}.`,
                )
              }
            >
              <Repeat className="size-4" aria-hidden /> Demander
            </Bouton>
          </div>
        )}

        <ul className="divide-y rounded-xl border">
          {visibles.map((m) => {
            const d = demande(m.date)
            const cle = m.date
            return (
              <li key={m.date} className="flex items-center justify-between gap-3 px-3 py-2.5">
                <span className="min-w-0">
                  <span className="block font-medium">{majuscule(jourLong(m.date))}</span>
                  {d ? (
                    <span className="flex items-center gap-1 text-sm font-semibold text-emerald-700">
                      <Check className="size-4" aria-hidden /> Récupération demandée{g.lieux.length > 1 ? ` · ${d.lieu}` : ''}
                    </span>
                  ) : (
                    !m.modifiable && <span className="text-sm text-muted-foreground">Délai passé</span>
                  )}
                </span>
                {m.modifiable &&
                  (d ? (
                    <Bouton variante="secondaire" enCours={enCours === cle} onClick={() => agir(cle, () => appel('DELETE', `/api/famille/garderie/${e.id}/${m.date}`))}>
                      Annuler
                    </Bouton>
                  ) : (
                    <Bouton enCours={enCours === cle} onClick={() => agir(cle, () => appel('PUT', `/api/famille/garderie/${e.id}/${m.date}`, { lieu }))}>
                      Demander
                    </Bouton>
                  ))}
              </li>
            )
          })}
        </ul>
        {!tous && donnees.mercredis.length > VISIBLES && (
          <button type="button" onClick={() => setTous(true)} className="justify-self-start text-sm font-semibold text-brand">
            Voir les {donnees.mercredis.length - VISIBLES} mercredis suivants
          </button>
        )}
        {message && <p role="status" className="text-sm font-medium text-emerald-700">{message}</p>}
        <Alerte>{erreur}</Alerte>
      </div>
    </Bloc>
  )
}
