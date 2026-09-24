import { useState } from 'react'
import { useParams } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Banknote, Phone, Trash2, Undo2 } from 'lucide-react'
import { Bloc, Espace } from '../../components/espace/Garde'
import { FormulairePaiement, TroisCheques } from '../../components/espace/FormulairePaiement'
import { Alerte, Bouton } from '../../components/formulaire'
import { Pastille } from '../../components/ui'
import { formuleParId, MODES_PAIEMENT, type ModePaiement } from '../../content/adhesion'
import { echeancier, LIBELLES_STATUT_PAIEMENT, MODES_ENCAISSEMENT } from '../../content/paiements'
import { appel, dateFr, ErreurApi } from '../../lib/api'
import type { DossierTresorerie, FicheFamille, Paiement } from '../../lib/paiements'
import { euros } from '../../lib/tarifs'

const aujourdhui = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Paris' })

export function TresorerieFamillePage() {
  const { id } = useParams({ from: '/espace/tresorerie/familles/$id' })
  const client = useQueryClient()
  const { data, isPending, isError } = useQuery({
    queryKey: ['tresorerie', 'famille', id],
    queryFn: () => appel<FicheFamille>('GET', `/api/tresorerie/familles/${id}`),
  })
  const rafraichir = () => client.invalidateQueries({ queryKey: ['tresorerie'] })

  return (
    <Espace
      titre={data ? `Famille ${data.famille.libelle}` : 'Famille'}
      retour={{ to: '/espace/tresorerie', libelle: 'Trésorerie' }}
      roles={['tresorier', 'admin']}
      aide="tresorerie"
      refus="Cette page est réservée au trésorier du club."
    >
      {() => {
        if (isPending) return <p className="text-muted-foreground">Chargement…</p>
        if (isError) return <Alerte>Famille introuvable.</Alerte>
        const f = data.famille
        return (
          <div className="grid grid-cols-1 gap-6">
            <Bloc titre="Situation">
              <dl className="grid grid-cols-3 gap-2 sm:gap-4">
                {(
                  [
                    ['Dû', f.du],
                    ['Payé', f.paye],
                    ['Reste', f.restant],
                  ] as const
                ).map(([l, v]) => (
                  <div key={l}>
                    <dt className="text-sm text-muted-foreground">{l}</dt>
                    <dd className="text-xl font-extrabold tabular-nums sm:text-2xl">{euros(v)}</dd>
                  </div>
                ))}
              </dl>
              {f.retard > 0 && <p className="mt-2 text-sm font-medium text-amber-800">{euros(f.retard)} de versements échus non reçus</p>}
              {f.tropPercu > 0 && <p className="mt-2 text-sm font-medium text-amber-800">{euros(f.tropPercu)} payés en trop</p>}
              {f.responsables.length > 0 && (
                <ul className="mt-4 grid gap-1 border-t pt-3 text-sm">
                  {f.responsables.map((r) => (
                    <li key={r.id} className="flex flex-wrap items-center gap-x-2">
                      <span className="font-medium">
                        {r.prenom} {r.nom}
                      </span>
                      {r.telephone && (
                        <a href={`tel:${r.telephone.replace(/\s/g, '')}`} className="inline-flex items-center gap-1 text-brand">
                          <Phone className="size-3.5" aria-hidden /> {r.telephone}
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </Bloc>

            {f.dossiers.map((d) => (
              <Dossier key={d.adhesion_id} dossier={d} dates={data.echeances.dates} rafraichir={rafraichir} />
            ))}

            {f.restant > 0 && (
              <Bloc titre="Enregistrer un paiement">
                {/* key : formulaire réinitialisé (montant restant à jour) après chaque enregistrement. */}
                <FormulairePaiement key={`${f.paye}`} dossiers={f.dossiers} onEnregistre={rafraichir} />
              </Bloc>
            )}

            <Paiements paiements={data.paiements} rafraichir={rafraichir} />
          </div>
        )
      }}
    </Espace>
  )
}

function Dossier({ dossier: d, dates, rafraichir }: { dossier: DossierTresorerie; dates: [string, string]; rafraichir: () => Promise<void> }) {
  const [troisCheques, setTroisCheques] = useState(false)
  const versements = echeancier(d)
  return (
    <Bloc
      titre={`${d.prenom} ${d.nom}`}
      action={
        <Pastille ton={d.statut === 'solde' ? 'ouvert' : d.retard > 0 ? 'annule' : 'ferme'}>
          {d.retard > 0 ? `${euros(d.retard)} en retard` : LIBELLES_STATUT_PAIEMENT[d.statut]}
        </Pastille>
      }
    >
      <p className="text-sm text-muted-foreground">
        {formuleParId(d.formule)?.nom ?? d.formule} · {euros(d.montant_total)}
        {d.paiement_mode ? ` · prévu : ${MODES_PAIEMENT[d.paiement_mode as ModePaiement] ?? d.paiement_mode}` : ''}
        {d.paiement_3_fois ? ' en 3 fois' : ''}
      </p>
      <ul className="mt-2 grid gap-0.5 text-sm">
        {versements.map((v, i) => (
          <li key={i}>
            {euros(v.montant)} {v.date ? `au ${dateFr(v.date)}` : 'à l’inscription'}
          </li>
        ))}
      </ul>
      <p className="mt-2 font-medium">
        Payé {euros(d.paye)} · reste {euros(d.restant)}
      </p>
      {d.paiement_3_fois && d.paye === 0 ? (
        <div className="mt-4 border-t pt-4">
          {troisCheques ? (
            <TroisCheques
              dossier={d}
              dates={dates}
              onEnregistre={async () => {
                await rafraichir()
                setTroisCheques(false)
              }}
              onAnnule={() => setTroisCheques(false)}
            />
          ) : (
            <Bouton variante="secondaire" onClick={() => setTroisCheques(true)}>
              Enregistrer les 3 chèques de {d.prenom}
            </Bouton>
          )}
        </div>
      ) : null}
    </Bloc>
  )
}

function Paiements({ paiements, rafraichir }: { paiements: Paiement[]; rafraichir: () => Promise<void> }) {
  const [confirmer, setConfirmer] = useState<number | null>(null)
  const [erreur, setErreur] = useState('')

  async function agir(action: () => Promise<unknown>) {
    setErreur('')
    try {
      await action()
      await rafraichir()
    } catch (err) {
      setErreur(err instanceof ErreurApi ? err.message : 'Action impossible.')
    }
  }

  return (
    <Bloc titre={`Paiements reçus (${paiements.length})`}>
      {paiements.length === 0 ? (
        <p className="text-muted-foreground">Aucun paiement enregistré.</p>
      ) : (
        <ul className="divide-y rounded-xl border">
          {paiements.map((p) => (
            <li key={p.id} className="grid gap-2 px-4 py-3">
              <div>
                <p className="font-semibold">
                  {euros(p.montant)} · {MODES_ENCAISSEMENT[p.mode]} · reçu le {dateFr(p.recu_le)}
                </p>
                {p.reference && <p className="text-sm text-muted-foreground">{p.reference}</p>}
                {p.parts.length > 1 && <p className="text-sm text-muted-foreground">{p.parts.map((x) => `${x.prenom} ${euros(x.montant)}`).join(' · ')}</p>}
                <p className="text-sm">
                  {p.encaisse_le ? (
                    <span className="text-emerald-700">Remis en banque le {dateFr(p.encaisse_le)}</span>
                  ) : p.encaisser_le ? (
                    <span className="text-amber-800">À encaisser le {dateFr(p.encaisser_le)}</span>
                  ) : (
                    <span className="text-amber-800">À remettre en banque</span>
                  )}
                </p>
              </div>
              {confirmer === p.id ? (
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-sm">Supprimer ce paiement de {euros(p.montant)} ?</span>
                  <Bouton variante="danger" onClick={() => agir(() => appel('DELETE', `/api/tresorerie/paiements/${p.id}`))}>
                    Confirmer
                  </Bouton>
                  <Bouton variante="secondaire" onClick={() => setConfirmer(null)}>
                    Annuler
                  </Bouton>
                </div>
              ) : (
                <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold">
                  {p.encaisse_le ? (
                    <button
                      type="button"
                      onClick={() => agir(() => appel('PUT', `/api/tresorerie/paiements/${p.id}/encaisse`, { encaisse_le: null }))}
                      className="inline-flex min-h-11 items-center gap-1.5 text-muted-foreground"
                    >
                      <Undo2 className="size-4" aria-hidden /> Annuler la remise
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => agir(() => appel('PUT', `/api/tresorerie/paiements/${p.id}/encaisse`, { encaisse_le: aujourdhui() }))}
                      className="inline-flex min-h-11 items-center gap-1.5 text-brand"
                    >
                      <Banknote className="size-4" aria-hidden /> Remis en banque
                    </button>
                  )}
                  <button type="button" onClick={() => setConfirmer(p.id)} className="inline-flex min-h-11 items-center gap-1.5 text-brand">
                    <Trash2 className="size-4" aria-hidden /> Supprimer
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      <div className="mt-3">
        <Alerte>{erreur}</Alerte>
      </div>
    </Bloc>
  )
}
