import { useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { ChevronRight, Plus } from 'lucide-react'
import { ChoixSaison, StatutDossier, useSaisonDossiers } from '../../components/espace/BlocAdhesion'
import { Espace } from '../../components/espace/Garde'
import { Bouton } from '../../components/formulaire'
import { formuleParId, LIBELLES_STATUT, type EtatDossier } from '../../content/adhesion'
import { appel, dateFr, type ListeDossiers } from '../../lib/api'
import { euros } from '../../lib/tarifs'

type Filtre = 'tous' | 'sans' | EtatDossier['statut']

export function AdhesionsPage() {
  const navigate = useNavigate()
  const [filtre, setFiltre] = useState<Filtre>('tous')
  // Saison courante, ou celle des inscriptions en ligne (010b).
  const { saison, requete, choixPossibles, choisir } = useSaisonDossiers()
  const { data, isPending, isError } = useQuery({
    queryKey: ['admin', 'adhesions', saison],
    queryFn: () => appel<ListeDossiers>('GET', `/api/admin/adhesions${requete}`),
  })
  const tarifs = data?.tarifs

  const lignes = data?.lignes ?? []
  const compte = (f: Filtre) => lignes.filter((l) => correspond(l.etat, f)).length
  const visibles = lignes.filter((l) => correspond(l.etat, filtre))
  const total = lignes.reduce((s, l) => s + (l.dossier?.montant_total ?? 0), 0)
  const filtres: [Filtre, string][] = [
    ['tous', 'Tous'],
    ['sans', 'Sans dossier'],
    ['a_completer', LIBELLES_STATUT.a_completer],
    ['complet', 'Complets'],
    ['valide', 'Validés'],
  ]

  return (
    <Espace titre={`Dossiers ${data?.saison.libelle ?? ''}`.trim()} retour={{ to: '/espace', libelle: 'Mon espace' }} roles={['bureau', 'admin']} aide="adhesions">
      {() => (
        <div className="grid gap-4">
          <ChoixSaison choix={choixPossibles} valeur={saison} onChange={choisir} />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {data && (
              <p className="text-muted-foreground">
                {lignes.length - compte('sans')} dossier{lignes.length - compte('sans') > 1 ? 's' : ''} sur {lignes.length} adhérent
                {lignes.length > 1 ? 's' : ''} · {euros(total)} au total
              </p>
            )}
            <Bouton onClick={() => navigate({ to: '/espace/adherents/nouveau' })}>
              <Plus className="size-4" aria-hidden /> Saisir un nouvel adhérent
            </Bouton>
          </div>

          <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrer les dossiers">
            {filtres.map(([f, libelle]) => (
              <button
                key={f}
                type="button"
                aria-pressed={filtre === f}
                onClick={() => setFiltre(f)}
                className="rounded-full border bg-white px-4 py-2 text-sm font-semibold aria-pressed:border-ink aria-pressed:bg-ink aria-pressed:text-white"
              >
                {libelle} <span className="opacity-70">{compte(f)}</span>
              </button>
            ))}
          </div>

          {isPending && <p className="text-muted-foreground">Chargement…</p>}
          {isError && <p className="text-brand">Impossible de charger les dossiers.</p>}
          <ul className="divide-y overflow-hidden rounded-2xl border bg-white shadow-sm">
            {visibles.map(({ adherent: a, dossier, etat }) => (
              <li key={a.id}>
                <Link
                  to="/espace/adherents/$id"
                  params={{ id: String(a.id) }}
                  className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-surface"
                >
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">
                        {a.prenom} {a.nom}
                      </span>
                      <StatutDossier etat={etat} />
                      {a.aVerifier && <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-900">Fiche à vérifier</span>}
                    </span>
                    <span className="block truncate text-sm text-muted-foreground">
                      {dossier ? `${(tarifs ? formuleParId(tarifs, dossier.formule)?.nom : undefined) ?? dossier.formule} · ${euros(dossier.montant_total)}` : 'Aucun dossier pour cette saison'}
                    </span>
                    {dossier?.envoye_le && <span className="block text-sm text-sky-800">Envoyé en ligne le {dateFr(dossier.envoye_le.slice(0, 10))}</span>}
                    {etat && etat.manques.length > 0 && <span className="block text-sm font-medium text-brand">Manque : {etat.manques.join(', ')}</span>}
                    {etat && etat.manques.length === 0 && etat.aRecueillir.length > 0 && (
                      <span className="block text-sm text-amber-800">À recueillir : {etat.aRecueillir.join(', ')}</span>
                    )}
                  </span>
                  <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden />
                </Link>
              </li>
            ))}
            {data && visibles.length === 0 && <li className="px-4 py-6 text-center text-muted-foreground">Aucun adhérent dans cette catégorie.</li>}
          </ul>
        </div>
      )}
    </Espace>
  )
}

function correspond(etat: EtatDossier | null, f: Filtre): boolean {
  if (f === 'tous') return true
  if (f === 'sans') return etat === null
  return etat?.statut === f
}
