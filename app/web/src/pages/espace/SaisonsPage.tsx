import { useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronRight, CopyPlus } from 'lucide-react'
import { Espace } from '../../components/espace/Garde'
import { Alerte, Bouton } from '../../components/formulaire'
import { Pastille } from '../../components/ui'
import { saisonSuivante } from '../../content/referentiel'
import { appel, dateHeureFr, ErreurApi } from '../../lib/api'
import type { SaisonResume } from '../../lib/saison'

export function SaisonsPage() {
  const client = useQueryClient()
  const navigate = useNavigate()
  const [erreur, setErreur] = useState('')
  const [enCours, setEnCours] = useState(false)
  const { data, isPending, isError } = useQuery({
    queryKey: ['admin', 'saisons'],
    queryFn: () => appel<SaisonResume[]>('GET', '/api/admin/saisons'),
  })
  // La plus récente sert de modèle à la suivante.
  const derniere = data?.[0]
  const suivante = derniere ? saisonSuivante(derniere.id) : null

  async function preparer() {
    if (!derniere || !suivante) return
    setEnCours(true)
    setErreur('')
    try {
      await appel('POST', `/api/admin/saisons/${derniere.id}/suivante`)
      await client.invalidateQueries({ queryKey: ['admin', 'saisons'] })
      navigate({ to: '/espace/saisons/$id', params: { id: suivante.id } })
    } catch (err) {
      setErreur(err instanceof ErreurApi ? err.message : 'Préparation impossible.')
    } finally {
      setEnCours(false)
    }
  }

  return (
    <Espace titre="Saisons et tarifs" retour={{ to: '/espace', libelle: 'Mon espace' }} roles={['bureau', 'admin']} aide="saisons">
      {() => (
        <div className="grid grid-cols-1 gap-6">
          <p className="text-muted-foreground">
            Catégories d’âge, tarifs, dates du paiement en 3 fois et horaires des cours, saison par saison. La saison courante sert aux
            dossiers, à la trésorerie, aux compétitions et à la page publique « Horaires & tarifs ».
          </p>
          {suivante && (
            <div className="grid gap-2">
              <div>
                <Bouton onClick={preparer} enCours={enCours}>
                  <CopyPlus className="size-4" aria-hidden /> Préparer la saison {suivante.libelle}
                </Bouton>
              </div>
              <p className="text-sm text-muted-foreground">
                Copie de {derniere?.libelle}, années de naissance et dates décalées d’un an ; ajustez ensuite tarifs et horaires. Elle ne
                devient courante que lorsque vous le décidez.
              </p>
            </div>
          )}
          <Alerte>{erreur}</Alerte>
          {isPending && <p className="text-muted-foreground">Chargement…</p>}
          {isError && <Alerte>Impossible de charger les saisons.</Alerte>}
          <ul className="divide-y overflow-hidden rounded-2xl border bg-white shadow-sm">
            {data?.map((s) => (
              <li key={s.id}>
                <Link to="/espace/saisons/$id" params={{ id: s.id }} className="flex items-center gap-3 px-4 py-3.5 hover:bg-surface">
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">Saison {s.libelle}</span>
                      {s.courante && <Pastille ton="ouvert">Courante</Pastille>}
                      {s.inscriptions_ouvertes && <Pastille ton="ferme">Inscriptions ouvertes</Pastille>}
                    </span>
                    <span className="block text-sm text-muted-foreground">
                      {s.dossiers} dossier{s.dossiers > 1 ? 's' : ''} · modifiée le {dateHeureFr(s.modifie_le)}
                    </span>
                  </span>
                  <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Espace>
  )
}
