import { useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { ChevronRight, Plus, Search } from 'lucide-react'
import { Espace } from '../../components/espace/Garde'
import { Bouton } from '../../components/formulaire'
import { age, appel, type AdherentListe } from '../../lib/api'

export function AdherentsPage() {
  const [q, setQ] = useState('')
  const navigate = useNavigate()
  const { data, isPending, isError } = useQuery({
    queryKey: ['admin', 'adherents'],
    queryFn: () => appel<AdherentListe[]>('GET', '/api/admin/adherents'),
  })

  // Filtre local : quelques centaines d'adhérents au plus → instantané, même hors ligne une fois chargé.
  const terme = q.trim().toLowerCase()
  const liste = (data ?? []).filter((a) => `${a.prenom} ${a.nom} ${a.nom} ${a.prenom}`.toLowerCase().includes(terme))

  return (
    <Espace titre="Adhérents" retour={{ to: '/espace', libelle: 'Mon espace' }} roles={['bureau', 'admin']} aide="adherents">
      {() => (
        <div className="grid gap-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <label className="relative flex-1">
              <span className="sr-only">Rechercher un adhérent</span>
              <Search className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <input
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Rechercher un nom…"
                className="min-h-12 w-full rounded-xl border bg-white pr-3.5 pl-11 text-base outline-none focus:border-brand"
              />
            </label>
            <Bouton onClick={() => navigate({ to: '/espace/adherents/nouveau' })}>
              <Plus className="size-4" aria-hidden /> Ajouter un adhérent
            </Bouton>
          </div>

          {isPending && <p className="text-muted-foreground">Chargement…</p>}
          {isError && <p className="text-brand">Impossible de charger la liste.</p>}
          {data && (
            <p className="text-sm text-muted-foreground">
              {liste.length} adhérent{liste.length > 1 ? 's' : ''}
              {terme && ` sur ${data.length}`}
            </p>
          )}
          <ul className="divide-y overflow-hidden rounded-2xl border bg-white shadow-sm">
            {liste.map((a) => (
              <li key={a.id}>
                <Link
                  to="/espace/adherents/$id"
                  params={{ id: String(a.id) }}
                  className="flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-surface"
                >
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-ink text-sm font-bold text-white" aria-hidden>
                    {a.prenom[0]}
                    {a.nom[0]}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">
                      {a.prenom} {a.nom}
                    </span>
                    <span className="block truncate text-sm text-muted-foreground">
                      {age(a.date_naissance)} ans{a.grade ? ` · ceinture ${a.grade.toLowerCase()}` : ''}
                      {a.responsables.length === 0 && <span className="font-medium text-brand"> · aucun responsable</span>}
                    </span>
                  </span>
                  <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden />
                </Link>
              </li>
            ))}
            {data && liste.length === 0 && <li className="px-4 py-6 text-center text-muted-foreground">Aucun adhérent trouvé.</li>}
          </ul>
        </div>
      )}
    </Espace>
  )
}
