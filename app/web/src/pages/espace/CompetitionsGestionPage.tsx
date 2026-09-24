import { useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronRight, Plus } from 'lucide-react'
import { Bloc, Espace } from '../../components/espace/Garde'
import { FormulaireCompetition } from '../../components/espace/FormulaireCompetition'
import { Bouton } from '../../components/formulaire'
import { Pastille } from '../../components/ui'
import { appel, dateFr } from '../../lib/api'
import { useReferentiel } from '../../lib/saison'
import { libelleCriteres, LIBELLES_STATUT_COMPETITION, type CompetitionBureau } from '../../lib/competitions'

const aujourdhui = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Paris' })

export function CompetitionsGestionPage() {
  const client = useQueryClient()
  const navigate = useNavigate()
  const [creation, setCreation] = useState(false)
  const { data, isPending, isError } = useQuery({
    queryKey: ['admin', 'competitions'],
    queryFn: () => appel<CompetitionBureau[]>('GET', '/api/admin/competitions'),
  })

  const jour = aujourdhui()
  const aVenir = (data ?? []).filter((c) => c.date >= jour).reverse()
  const passees = (data ?? []).filter((c) => c.date < jour)

  return (
    <Espace titre="Compétitions" retour={{ to: '/espace', libelle: 'Mon espace' }} roles={['bureau', 'admin']} aide="competitions-bureau">
      {() => (
        <div className="grid grid-cols-1 gap-6">
          {creation ? (
            <Bloc titre="Nouvelle compétition">
              <FormulaireCompetition
                onEnregistre={async (id) => {
                  await client.invalidateQueries({ queryKey: ['admin', 'competitions'] })
                  await client.invalidateQueries({ queryKey: ['competitions'] })
                  navigate({ to: '/espace/competitions/$id', params: { id: String(id) } })
                }}
                onAnnule={() => setCreation(false)}
              />
            </Bloc>
          ) : (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-muted-foreground">
                Créez la compétition, puis partagez son lien dans le groupe WhatsApp : les parents y inscrivent leurs enfants.
              </p>
              <Bouton onClick={() => setCreation(true)}>
                <Plus className="size-4" aria-hidden /> Nouvelle compétition
              </Bouton>
            </div>
          )}

          {isPending && <p className="text-muted-foreground">Chargement…</p>}
          {isError && <p className="text-brand">Impossible de charger les compétitions.</p>}
          {data && <Liste titre="À venir" competitions={aVenir} vide="Aucune compétition à venir." />}
          {passees.length > 0 && <Liste titre="Passées" competitions={passees} />}
        </div>
      )}
    </Espace>
  )
}

function Liste({ titre, competitions, vide }: { titre: string; competitions: CompetitionBureau[]; vide?: string }) {
  const categories = useReferentiel()?.categories ?? []
  return (
    <section>
      <h2 className="mb-3 text-lg font-bold">{titre}</h2>
      <ul className="divide-y overflow-hidden rounded-2xl border bg-white shadow-sm">
        {competitions.map((c) => (
          <li key={c.id}>
            <Link
              to="/espace/competitions/$id"
              params={{ id: String(c.id) }}
              className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-surface"
            >
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">{c.nom}</span>
                  {c.statut !== 'ouverte' && <Pastille ton={c.statut === 'annulee' ? 'annule' : 'ferme'}>{LIBELLES_STATUT_COMPETITION[c.statut]}</Pastille>}
                </span>
                <span className="block text-sm text-muted-foreground">
                  {dateFr(c.date)} · {c.lieu}
                </span>
                <span className="block text-sm text-muted-foreground">{libelleCriteres(c, categories)}</span>
                <span className="block text-sm">
                  {c.inscrits} inscrit{c.inscrits > 1 ? 's' : ''}
                  {c.inscrits > 0 && (
                    <span className={c.ressaisis < c.inscrits ? 'font-medium text-amber-800' : 'text-muted-foreground'}>
                      {' '}
                      · {c.ressaisis === c.inscrits ? 'tous ressaisis' : `${c.inscrits - c.ressaisis} à ressaisir`}
                    </span>
                  )}
                </span>
              </span>
              <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden />
            </Link>
          </li>
        ))}
        {competitions.length === 0 && vide && <li className="px-4 py-6 text-center text-muted-foreground">{vide}</li>}
      </ul>
    </section>
  )
}
