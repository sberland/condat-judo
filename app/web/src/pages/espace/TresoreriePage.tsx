import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Banknote, ChevronRight, Download } from 'lucide-react'
import { Bloc, Espace } from '../../components/espace/Garde'
import { Alerte, Bouton, Champ } from '../../components/formulaire'
import { Pastille } from '../../components/ui'
import { LIBELLES_STATUT_PAIEMENT, MODES_ENCAISSEMENT, type Situation } from '../../content/paiements'
import { appel, dateFr, ErreurApi } from '../../lib/api'
import { telechargerCsv } from '../../lib/csv'
import { tableauFamilles, tableauPaiements, type FamilleResume, type Paiement, type TableauTresorerie } from '../../lib/paiements'
import { euros } from '../../lib/tarifs'

type Filtre = 'toutes' | 'retard' | 'a_payer' | 'partiel' | 'solde'
const FILTRES: [Filtre, string][] = [
  ['toutes', 'Toutes'],
  ['retard', 'En retard'],
  ['a_payer', 'À payer'],
  ['partiel', 'Partiellement payées'],
  ['solde', 'Soldées'],
]
const correspond = (f: FamilleResume, filtre: Filtre) => (filtre === 'toutes' ? true : filtre === 'retard' ? f.retard > 0 : f.statut === filtre)
const aujourdhui = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Paris' })

export function TresoreriePage() {
  const { data, isPending, isError } = useQuery({
    queryKey: ['tresorerie'],
    queryFn: () => appel<TableauTresorerie>('GET', '/api/tresorerie'),
  })

  return (
    <Espace
      titre={`Trésorerie ${data?.saison.libelle ?? ''}`.trim()}
      retour={{ to: '/espace', libelle: 'Mon espace' }}
      roles={['tresorier', 'admin']}
      aide="tresorerie"
      refus="Cette page est réservée au trésorier du club."
    >
      {() => {
        if (isPending) return <p className="text-muted-foreground">Chargement…</p>
        if (isError) return <Alerte>Impossible de charger la trésorerie.</Alerte>
        return (
          <div className="grid grid-cols-1 gap-6">
            <Totaux totaux={data.totaux} />
            {data.echeances.provisoire && (
              <p className="text-sm text-muted-foreground">
                Paiement en 3 fois : 2e et 3e versements attendus le {dateFr(data.echeances.dates[0])} et le {dateFr(data.echeances.dates[1])}{' '}
                (dates à confirmer).
              </p>
            )}
            <ARemettre paiements={data.aRemettre} />
            <Familles familles={data.familles} saison={data.saison.id} />
          </div>
        )
      }}
    </Espace>
  )
}

function Totaux({ totaux: t }: { totaux: Situation }) {
  const chiffres: [string, number, string][] = [
    ['Dû', t.du, 'text-foreground'],
    ['Payé', t.paye, 'text-emerald-700'],
    ['Reste à payer', t.restant, t.restant ? 'text-brand' : 'text-foreground'],
  ]
  return (
    <section className="grid grid-cols-3 gap-2 rounded-2xl border bg-white p-4 shadow-sm sm:gap-4 sm:p-6" aria-label="Totaux de la saison">
      {chiffres.map(([libelle, valeur, couleur]) => (
        <div key={libelle}>
          <p className="text-xs text-muted-foreground sm:text-sm">{libelle}</p>
          <p className={`text-lg font-extrabold tabular-nums sm:text-3xl ${couleur}`}>{euros(valeur)}</p>
        </div>
      ))}
      {t.retard > 0 && <p className="col-span-3 text-sm font-medium text-amber-800">dont {euros(t.retard)} de versements échus non reçus</p>}
    </section>
  )
}

/** Chèques et espèces reçus, à remettre en banque (échéance dépassée ou dans le mois). */
function ARemettre({ paiements }: { paiements: Paiement[] }) {
  const client = useQueryClient()
  const [erreur, setErreur] = useState('')
  const total = paiements.reduce((s, p) => s + p.montant, 0)

  async function remis(p: Paiement) {
    setErreur('')
    try {
      await appel('PUT', `/api/tresorerie/paiements/${p.id}/encaisse`, { encaisse_le: aujourdhui() })
      await client.invalidateQueries({ queryKey: ['tresorerie'] })
    } catch (err) {
      setErreur(err instanceof ErreurApi ? err.message : 'Action impossible.')
    }
  }

  return (
    <Bloc titre={`À remettre en banque (${paiements.length})`}>
      {paiements.length === 0 ? (
        <p className="text-muted-foreground">Rien à remettre en banque ce mois-ci.</p>
      ) : (
        <>
          <p className="mb-3 text-sm text-muted-foreground">Total : {euros(total)}. Échéance dépassée ou dans le mois.</p>
          <ul className="divide-y rounded-xl border">
            {paiements.map((p) => (
              <li key={p.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="font-semibold">
                    {euros(p.montant)} · {MODES_ENCAISSEMENT[p.mode]}
                    <span className="font-normal text-muted-foreground"> · {p.parts.map((x) => `${x.prenom} ${x.nom}`).join(', ')}</span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {p.reference ? `${p.reference} · ` : ''}
                    {p.encaisser_le ? `à encaisser le ${dateFr(p.encaisser_le)}` : `reçu le ${dateFr(p.recu_le)}`}
                  </p>
                </div>
                <Bouton variante="secondaire" onClick={() => remis(p)}>
                  <Banknote className="size-4" aria-hidden /> Remis en banque
                </Bouton>
              </li>
            ))}
          </ul>
        </>
      )}
      <div className="mt-3">
        <Alerte>{erreur}</Alerte>
      </div>
    </Bloc>
  )
}

function Familles({ familles, saison }: { familles: FamilleResume[]; saison: string }) {
  const [filtre, setFiltre] = useState<Filtre>('toutes')
  const [recherche, setRecherche] = useState('')
  const q = recherche.trim().toLowerCase()
  const visibles = familles.filter(
    (f) => correspond(f, filtre) && (!q || `${f.libelle} ${f.membres.map((m) => m.prenom).join(' ')}`.toLowerCase().includes(q)),
  )

  async function exporterPaiements() {
    const paiements = await appel<Paiement[]>('GET', '/api/tresorerie/paiements')
    telechargerCsv(`paiements-${saison}.csv`, tableauPaiements(paiements))
  }

  return (
    <Bloc
      titre="Familles"
      action={
        <div className="flex flex-wrap gap-2">
          <Bouton variante="secondaire" onClick={exporterPaiements}>
            <Download className="size-4" aria-hidden /> Paiements (CSV)
          </Bouton>
          <Bouton variante="secondaire" onClick={() => telechargerCsv(`familles-${saison}.csv`, tableauFamilles(familles))}>
            <Download className="size-4" aria-hidden /> Familles (CSV)
          </Bouton>
        </div>
      }
    >
      <div className="mb-3 flex flex-wrap gap-2" role="group" aria-label="Filtrer les familles">
        {FILTRES.map(([f, libelle]) => (
          <button
            key={f}
            type="button"
            aria-pressed={filtre === f}
            onClick={() => setFiltre(f)}
            className="rounded-full border bg-white px-4 py-2 text-sm font-semibold aria-pressed:border-ink aria-pressed:bg-ink aria-pressed:text-white"
          >
            {libelle} <span className="opacity-70">{familles.filter((x) => correspond(x, f)).length}</span>
          </button>
        ))}
      </div>
      {familles.length > 8 && (
        <div className="mb-3">
          <Champ id="familles-recherche" libelle="Rechercher" valeur={recherche} onChange={setRecherche} />
        </div>
      )}
      <ul className="divide-y rounded-xl border">
        {visibles.map((f) => (
          <li key={f.id}>
            <Link
              to="/espace/tresorerie/familles/$id"
              params={{ id: String(f.id) }}
              className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-surface"
            >
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">{f.libelle}</span>
                  <Pastille ton={f.statut === 'solde' ? 'ouvert' : f.retard > 0 ? 'annule' : 'ferme'}>
                    {f.retard > 0 ? `${euros(f.retard)} en retard` : LIBELLES_STATUT_PAIEMENT[f.statut]}
                  </Pastille>
                </span>
                <span className="block text-sm text-muted-foreground">
                  {f.membres.map((m) => m.prenom).join(', ')} · dû {euros(f.du)} · reste {euros(f.restant)}
                </span>
              </span>
              <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden />
            </Link>
          </li>
        ))}
        {visibles.length === 0 && <li className="px-4 py-6 text-center text-muted-foreground">Aucune famille dans cette catégorie.</li>}
      </ul>
    </Bloc>
  )
}
