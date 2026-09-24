import { useState, type FormEvent } from 'react'
import { Link, useParams } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ExternalLink, History, RotateCcw } from 'lucide-react'
import { Bloc, Espace } from '../../components/espace/Garde'
import { EditeurChamps } from '../../components/espace/EditeurContenu'
import { Alerte, Bouton } from '../../components/formulaire'
import { DEFINITIONS, validerContenu, type CleContenu, type ErreursContenu, type StatutContenu } from '../../content/contenu'
import { appel, dateHeureFr, ErreurApi } from '../../lib/api'
import { PAGE_DU_CONTENU, type DetailContenu } from '../../lib/contenu'

// Modifier un contenu du site (spec 014) : formulaire décrit par content/contenu.ts, statut
// « à compléter », historique des versions avec retour à une version précédente.

export function ContenuPage() {
  const { cle } = useParams({ from: '/espace/contenu/$cle' })
  const connu = Object.hasOwn(DEFINITIONS, cle)
  const { data, isPending, isError } = useQuery({
    queryKey: ['contenu-gestion', cle],
    queryFn: () => appel<DetailContenu>('GET', `/api/contenu/gestion/${cle}`),
    enabled: connu,
  })

  return (
    <Espace
      titre={connu ? DEFINITIONS[cle as CleContenu].titre : 'Contenu du site'}
      retour={{ to: '/espace/contenu', libelle: 'Contenu du site' }}
      roles={['contenu', 'admin']}
      refus="Cette page est réservée à la personne qui gère le contenu du site."
      aide="contenu"
    >
      {() => {
        if (!connu) return <Alerte>Contenu inconnu.</Alerte>
        if (isPending) return <p className="text-muted-foreground">Chargement…</p>
        if (isError) return <Alerte>Impossible de charger ce contenu.</Alerte>
        return (
          <div className="grid grid-cols-1 gap-6">
            {/* Nouvelle clé après chaque enregistrement : le formulaire repart de la version en ligne. */}
            <Formulaire key={`${data.modifie_le}-${data.versions[0]?.id ?? 0}`} detail={data} />
            <Historique detail={data} />
          </div>
        )
      }}
    </Espace>
  )
}

function Formulaire({ detail }: { detail: DetailContenu }) {
  const client = useQueryClient()
  const def = DEFINITIONS[detail.cle]
  const [valeur, setValeur] = useState(detail.valeur)
  const [statut, setStatut] = useState<StatutContenu>(detail.statut)
  const [erreurs, setErreurs] = useState<ErreursContenu>({})
  const [message, setMessage] = useState('')
  const [enCours, setEnCours] = useState(false)

  async function enregistrer(e: FormEvent) {
    e.preventDefault()
    setMessage('')
    const r = validerContenu(detail.cle, valeur)
    if (!r.ok) {
      setErreurs(r.erreurs)
      setMessage('Vérifiez les champs signalés.')
      return
    }
    setErreurs({})
    setEnCours(true)
    try {
      await appel('PUT', `/api/contenu/gestion/${detail.cle}`, { valeur: r.valeur, statut })
      await Promise.all([client.invalidateQueries({ queryKey: ['contenu'] }), client.invalidateQueries({ queryKey: ['contenu-gestion'] })])
    } catch (err) {
      if (err instanceof ErreurApi) {
        setErreurs(err.erreurs)
        setMessage(Object.keys(err.erreurs).length ? 'Vérifiez les champs signalés.' : err.message)
      } else setMessage('Enregistrement impossible, réessayez.')
    } finally {
      setEnCours(false)
    }
  }

  return (
    <form onSubmit={enregistrer} className="grid gap-6" noValidate>
      <Bloc titre="Contenu">
        <p className="mb-4 text-sm text-muted-foreground">{def.description}</p>
        <EditeurChamps champs={def.champs} valeur={valeur} onChange={setValeur} erreurs={erreurs} />
      </Bloc>
      {def.statut && (
        <Bloc titre="Statut">
          <div className="grid gap-2" role="radiogroup" aria-label="Statut du contenu">
            {(
              [
                ['publie', 'Publié', 'Visible sur le site.'],
                ['a_completer', 'À compléter', 'Masqué sur le site public ; visible avec un badge sur le site de test.'],
              ] as const
            ).map(([v, libelle, aide]) => (
              <label key={v} className={`flex min-h-12 cursor-pointer items-start gap-3 rounded-xl border px-3.5 py-3 ${statut === v ? 'border-ink ring-1 ring-ink' : 'bg-white'}`}>
                <input type="radio" name="statut" checked={statut === v} onChange={() => setStatut(v)} className="mt-0.5 size-5 accent-brand" />
                <span>
                  <span className="block font-medium">{libelle}</span>
                  <span className="block text-sm text-muted-foreground">{aide}</span>
                </span>
              </label>
            ))}
          </div>
        </Bloc>
      )}
      <Alerte>{message}</Alerte>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Bouton type="submit" enCours={enCours}>
          Enregistrer et publier
        </Bouton>
        <Link to={PAGE_DU_CONTENU[detail.cle]} className="inline-flex min-h-12 items-center justify-center gap-2 font-semibold text-brand">
          <ExternalLink className="size-4" aria-hidden /> Voir sur le site
        </Link>
      </div>
      <p className="text-sm text-muted-foreground">
        En ligne depuis le {dateHeureFr(detail.modifie_le)}
        {detail.modifie_par ? `, par ${detail.modifie_par}` : ''}.
      </p>
    </form>
  )
}

function Historique({ detail }: { detail: DetailContenu }) {
  const client = useQueryClient()
  const [aConfirmer, setAConfirmer] = useState<number | null>(null)
  const [erreur, setErreur] = useState('')

  async function restaurer(id: number) {
    setErreur('')
    try {
      await appel('POST', `/api/contenu/gestion/${detail.cle}/versions/${id}/restaurer`)
      setAConfirmer(null)
      await Promise.all([client.invalidateQueries({ queryKey: ['contenu'] }), client.invalidateQueries({ queryKey: ['contenu-gestion'] })])
    } catch (err) {
      setErreur(err instanceof ErreurApi ? err.message : 'Retour impossible, réessayez.')
    }
  }

  return (
    <Bloc titre="Historique">
      <p className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
        <History className="size-4" aria-hidden /> Les 30 dernières versions. Revenir à une version la republie telle quelle.
      </p>
      <ul className="divide-y rounded-xl border">
        {detail.versions.map((v, i) => (
          <li key={v.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5">
            <span className="min-w-0 text-sm">
              <span className="font-medium">{dateHeureFr(v.modifie_le)}</span>
              {v.modifie_par && <span className="text-muted-foreground"> · {v.modifie_par}</span>}
              {v.statut === 'a_completer' && <span className="text-amber-800"> · à compléter</span>}
              {i === 0 && <span className="font-semibold text-emerald-700"> · en ligne</span>}
            </span>
            {i > 0 &&
              (aConfirmer === v.id ? (
                <span className="flex gap-2">
                  <button type="button" onClick={() => restaurer(v.id)} className="min-h-10 rounded-full bg-brand px-3 text-sm font-semibold text-white">
                    Confirmer
                  </button>
                  <button type="button" onClick={() => setAConfirmer(null)} className="min-h-10 rounded-full border bg-white px-3 text-sm font-semibold">
                    Annuler
                  </button>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setAConfirmer(v.id)}
                  className="inline-flex min-h-10 items-center gap-1.5 rounded-full border bg-white px-3 text-sm font-semibold hover:text-brand"
                >
                  <RotateCcw className="size-4" aria-hidden /> Revenir à cette version
                </button>
              ))}
          </li>
        ))}
      </ul>
      <div className="mt-3">
        <Alerte>{erreur}</Alerte>
      </div>
    </Bloc>
  )
}
