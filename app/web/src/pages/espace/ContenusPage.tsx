import { Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { ChevronRight } from 'lucide-react'
import { Espace } from '../../components/espace/Garde'
import { Alerte } from '../../components/formulaire'
import { CLES_CONTENU, DEFINITIONS } from '../../content/contenu'
import { appel, dateHeureFr } from '../../lib/api'
import type { LigneContenu } from '../../lib/contenu'

// Contenu du site (spec 014) : chaque contenu administré, son statut et sa dernière modification.

export function ContenusPage() {
  const { data, isPending, isError } = useQuery({
    queryKey: ['contenu-gestion'],
    queryFn: () => appel<LigneContenu[]>('GET', '/api/contenu/gestion'),
  })

  return (
    <Espace
      titre="Contenu du site"
      retour={{ to: '/espace', libelle: 'Mon espace' }}
      roles={['contenu', 'admin']}
      refus="Cette page est réservée à la personne qui gère le contenu du site."
      aide="contenu"
    >
      {() => {
        if (isPending) return <p className="text-muted-foreground">Chargement…</p>
        if (isError) return <Alerte>Impossible de charger le contenu.</Alerte>
        const parCle = new Map(data.map((l) => [l.cle, l]))
        return (
          <div className="grid gap-4">
            <p className="text-muted-foreground">
              Chaque modification est visible aussitôt sur le site, et reste dans l’historique : on peut toujours revenir en arrière.
            </p>
            <ul className="grid gap-3">
              {CLES_CONTENU.map((cle) => {
                const l = parCle.get(cle)
                return (
                  <li key={cle}>
                    <Link
                      to="/espace/contenu/$cle"
                      params={{ cle }}
                      className="group flex items-center gap-4 rounded-2xl border bg-white p-4 shadow-sm transition hover:border-brand/40 hover:shadow-md"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="text-lg font-bold">{DEFINITIONS[cle].titre}</span>
                          {l?.statut === 'a_completer' && <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-900">À compléter</span>}
                        </span>
                        <span className="block text-sm text-muted-foreground">{DEFINITIONS[cle].description}</span>
                        {l && (
                          <span className="mt-1 block text-xs text-muted-foreground">
                            Modifié le {dateHeureFr(l.modifie_le)}
                            {l.modifie_par ? ` par ${l.modifie_par}` : ''}
                          </span>
                        )}
                      </span>
                      <ChevronRight className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden />
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        )
      }}
    </Espace>
  )
}
