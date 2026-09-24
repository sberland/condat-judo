import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Trash2, UserPlus } from 'lucide-react'
import { Bloc, Espace } from '../../components/espace/Garde'
import { Alerte, Bouton, Champ, Selection } from '../../components/formulaire'
import { appel, dateHeureFr, ErreurApi, type AdherentListe } from '../../lib/api'
import { jourCourt, jourLong, majuscule, type GarderieBureau } from '../../lib/garderie'

// Garderie du mercredi (spec 012a), côté bureau : la liste d'un mercredi, par lieu ; ajout ou
// retrait d'un enfant sans délai (demande tardive, erreur).

export function GarderieBureauPage() {
  const client = useQueryClient()
  const [date, setDate] = useState<string | null>(null)
  const { data, isPending, isError } = useQuery({
    queryKey: ['admin', 'garderie', date],
    queryFn: () => appel<GarderieBureau>('GET', `/api/admin/garderie${date ? `?date=${date}` : ''}`),
  })
  const rafraichir = () => client.invalidateQueries({ queryKey: ['admin', 'garderie'] })

  return (
    <Espace titre="Garderie du mercredi" retour={{ to: '/espace', libelle: 'Mon espace' }} roles={['bureau', 'admin']} aide="garderie-bureau">
      {() => {
        if (isPending) return <p className="text-muted-foreground">Chargement…</p>
        if (isError) return <Alerte>Impossible de charger la garderie.</Alerte>
        const parLieu = data.lieux.map((l) => ({ lieu: l, enfants: data.demandes.filter((d) => d.lieu === l) }))
        const autres = data.demandes.filter((d) => !data.lieux.includes(d.lieu))
        return (
          <div className="grid grid-cols-1 gap-6">
            <div className="flex flex-wrap gap-2" role="group" aria-label="Choisir le mercredi">
              {data.mercredis.map((m) => (
                <button
                  key={m}
                  type="button"
                  aria-pressed={m === data.date}
                  onClick={() => setDate(m)}
                  className="rounded-full border bg-white px-3.5 py-2 text-sm font-semibold aria-pressed:border-ink aria-pressed:bg-ink aria-pressed:text-white"
                >
                  {jourCourt(m)}
                </button>
              ))}
            </div>
            <Bloc titre={`${majuscule(jourLong(data.date))} · ${data.demandes.length} enfant${data.demandes.length > 1 ? 's' : ''}`}>
              {!data.ouvert && <p className="mb-3 text-sm font-medium text-amber-800">Mercredi sans garderie (réglages de la saison).</p>}
              {data.demandes.length === 0 && <p className="text-muted-foreground">Aucune demande pour ce mercredi.</p>}
              <div className="grid gap-4">
                {[...parLieu, ...(autres.length ? [{ lieu: 'Autre lieu', enfants: autres }] : [])]
                  .filter((p) => p.enfants.length)
                  .map((p) => (
                    <div key={p.lieu}>
                      {data.lieux.length > 1 && (
                        <p className="mb-1 font-semibold">
                          {p.lieu} · {p.enfants.length}
                        </p>
                      )}
                      <ul className="divide-y rounded-xl border">
                        {p.enfants.map((d) => (
                          <li key={d.adherent_id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                            <span className="min-w-0">
                              <span className="block font-medium">
                                {d.prenom} {d.nom}
                              </span>
                              <span className="block text-xs text-muted-foreground">
                                Demandé{d.demande_par ? ` par ${d.demande_par}` : ''}, le {dateHeureFr(d.demande_le)}
                              </span>
                            </span>
                            <button
                              type="button"
                              onClick={async () => {
                                await appel('DELETE', `/api/admin/garderie/${d.adherent_id}/${data.date}`)
                                await rafraichir()
                              }}
                              aria-label={`Retirer ${d.prenom}`}
                              className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-brand"
                            >
                              <Trash2 className="size-4" aria-hidden /> Retirer
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
              </div>
            </Bloc>
            <Ajout donnees={data} rafraichir={rafraichir} />
            <p className="text-sm text-muted-foreground">
              À venir : la liste du jour pour l’encadrant (photos si accord, personnes autorisées) et le pointage « récupéré ».
            </p>
          </div>
        )
      }}
    </Espace>
  )
}

/** Ajouter un enfant à ce mercredi (demande tardive, par téléphone…). */
function Ajout({ donnees, rafraichir }: { donnees: GarderieBureau; rafraichir: () => Promise<void> }) {
  const [q, setQ] = useState('')
  const [lieu, setLieu] = useState(donnees.lieux[0] ?? '')
  const [erreur, setErreur] = useState('')
  const recherche = q.trim()
  const { data: resultats } = useQuery({
    queryKey: ['admin', 'adherents', recherche],
    queryFn: () => appel<AdherentListe[]>('GET', `/api/admin/adherents?q=${encodeURIComponent(recherche)}`),
    enabled: recherche.length >= 2,
  })
  const deja = new Set(donnees.demandes.map((d) => d.adherent_id))

  return (
    <Bloc titre="Ajouter un enfant">
      <div className="grid gap-3">
        <Champ id="garderie-recherche" libelle="Rechercher (prénom ou nom)" valeur={q} onChange={setQ} />
        {donnees.lieux.length > 1 && (
          <Selection id="garderie-lieu" libelle="Lieu" valeur={lieu} options={donnees.lieux.map((l) => ({ valeur: l, libelle: l }))} onChange={(v) => v && setLieu(v)} />
        )}
        {resultats && (
          <ul className="divide-y rounded-xl border">
            {resultats.slice(0, 8).map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 px-3 py-2">
                <span>
                  {a.prenom} {a.nom}
                </span>
                {deja.has(a.id) ? (
                  <span className="text-sm text-muted-foreground">Déjà inscrit</span>
                ) : (
                  <Bouton
                    variante="secondaire"
                    onClick={async () => {
                      setErreur('')
                      try {
                        await appel('PUT', `/api/admin/garderie/${a.id}/${donnees.date}`, { lieu })
                        await rafraichir()
                      } catch (err) {
                        setErreur(err instanceof ErreurApi ? err.message : 'Ajout impossible.')
                      }
                    }}
                  >
                    <UserPlus className="size-4" aria-hidden /> Ajouter
                  </Bouton>
                )}
              </li>
            ))}
            {resultats.length === 0 && <li className="px-3 py-3 text-center text-muted-foreground">Aucun adhérent trouvé.</li>}
          </ul>
        )}
        <Alerte>{erreur}</Alerte>
      </div>
    </Bloc>
  )
}
