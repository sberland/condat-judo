import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, ChevronDown, Phone, Undo2, UserX, X } from 'lucide-react'
import { Bloc, Espace } from '../../components/espace/Garde'
import { Alerte } from '../../components/formulaire'
import { PhotoEnfant } from '../../components/espace/Photo'
import { appel, ErreurApi, QUALITES, type Qualite } from '../../lib/api'
import { jourCourt, jourLong, libellePointage, majuscule, type EnfantDuJour, type GarderieJour } from '../../lib/garderie'
import type { EtatPointage } from '../../content/garderie'

// Liste du mercredi de l'encadrant (spec 012b) : les enfants à récupérer par lieu, leur photo et
// qui peut venir les chercher. Visible le mercredi même seulement (contrôlé par l'API).
// Pointage (spec 012c) : récupéré / absent à la garderie, puis parti avec une personne autorisée ;
// la liste se rafraîchit toutes les 30 secondes (plusieurs encadrants, personne ajoutée par un parent).

export function GarderieJourPage() {
  const [date, setDate] = useState<string | null>(null)
  const [agrandie, setAgrandie] = useState<EnfantDuJour | null>(null)
  const { data, isPending, isError } = useQuery({
    queryKey: ['encadrant', 'garderie', date],
    queryFn: () => appel<GarderieJour>('GET', `/api/encadrant/garderie${date ? `?date=${date}` : ''}`),
    refetchInterval: (q) => (q.state.data?.enfants?.length ? 30_000 : false),
  })
  const photo = (e: EnfantDuJour) => (e.photo && data ? `/api/encadrant/garderie/${data.date}/photo/${e.id}` : null)

  return (
    <Espace
      titre="Mercredi du jour"
      retour={{ to: '/espace', libelle: 'Mon espace' }}
      roles={['encadrant', 'bureau', 'admin']}
      refus="Cette page est réservée aux encadrants et au bureau du club."
      aide="garderie-jour"
    >
      {() => {
        if (isPending) return <p className="text-muted-foreground">Chargement…</p>
        if (isError) return <Alerte>Impossible de charger la liste.</Alerte>
        const enfants = data.enfants
        const parLieu = enfants
          ? [...data.lieux, ...new Set(enfants.map((e) => e.lieu).filter((l) => !data.lieux.includes(l)))]
              .map((lieu) => ({ lieu, enfants: enfants.filter((e) => e.lieu === lieu) }))
              .filter((p) => p.enfants.length)
          : []
        return (
          <div className="grid grid-cols-1 gap-6">
            {data.essais && (
              <div className="grid gap-2 rounded-2xl border border-dashed border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
                <p>
                  <strong>Site de test</strong> : choisissez un mercredi pour essayer. Sur le site du club, la liste n’apparaît que le mercredi
                  même.
                </p>
                <div className="flex flex-wrap gap-2" role="group" aria-label="Mercredi à afficher">
                  {data.mercredis.map((m) => (
                    <button
                      key={m}
                      type="button"
                      aria-pressed={m === data.date}
                      onClick={() => setDate(m)}
                      className="rounded-full border bg-white px-3.5 py-2 font-semibold aria-pressed:border-ink aria-pressed:bg-ink aria-pressed:text-white"
                    >
                      {jourCourt(m)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {enfants === null ? (
              <Bloc titre="La liste s’affiche le mercredi">
                <p className="text-muted-foreground">
                  Les enfants à récupérer, avec leur photo et les personnes autorisées, apparaissent ici le jour même.
                  {data.prochain && <> Prochain mercredi de garderie : {jourLong(data.prochain)}.</>}
                </p>
              </Bloc>
            ) : (
              <Bloc titre={`${majuscule(jourLong(data.date))} · ${enfants.length} enfant${enfants.length > 1 ? 's' : ''}`}>
                {enfants.length === 0 && <p className="text-muted-foreground">Aucun enfant à récupérer ce mercredi.</p>}
                {enfants.length > 0 && <Compteurs enfants={enfants} />}
                <div className="grid gap-6">
                  {parLieu.map((p) => (
                    <section key={p.lieu} aria-label={p.lieu}>
                      <h3 className="mb-2 font-bold">
                        {p.lieu} · {p.enfants.length}
                      </h3>
                      <ul className="grid gap-3">
                        {p.enfants.map((e) => (
                          <CarteEnfant key={e.id} date={data.date} enfant={e} photo={photo(e)} agrandir={() => setAgrandie(e)} />
                        ))}
                      </ul>
                    </section>
                  ))}
                </div>
              </Bloc>
            )}

            {agrandie && photo(agrandie) && (
              <div
                role="dialog"
                aria-modal="true"
                aria-label={`Photo de ${agrandie.prenom} ${agrandie.nom}`}
                onClick={() => setAgrandie(null)}
                className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-black/85 p-4"
              >
                <img src={photo(agrandie) ?? ''} alt="" className="max-h-[75vh] max-w-full rounded-2xl object-contain" />
                <p className="text-xl font-bold text-white">
                  {agrandie.prenom} {agrandie.nom}
                </p>
                <button type="button" className="flex min-h-11 items-center gap-2 rounded-full bg-white px-5 font-semibold" onClick={() => setAgrandie(null)}>
                  <X className="size-4" aria-hidden /> Fermer
                </button>
              </div>
            )}
          </div>
        )
      }}
    </Espace>
  )
}

const TONS: Record<EtatPointage, string> = {
  demande: 'bg-surface text-foreground',
  recupere: 'bg-sky-100 text-sky-900',
  absent: 'bg-amber-100 text-amber-900',
  parti: 'bg-emerald-100 text-emerald-900',
}

function Compteurs({ enfants }: { enfants: EnfantDuJour[] }) {
  const n = (etat: EtatPointage) => enfants.filter((e) => e.pointage.etat === etat).length
  const recuperes = n('recupere') + n('parti')
  return (
    <p className="mb-4 flex flex-wrap gap-2 text-sm font-semibold" aria-live="polite">
      <span className={`rounded-full px-3 py-1 ${TONS.recupere}`}>
        Récupérés {recuperes}/{enfants.length}
      </span>
      {n('absent') > 0 && <span className={`rounded-full px-3 py-1 ${TONS.absent}`}>Absents {n('absent')}</span>}
      <span className={`rounded-full px-3 py-1 ${TONS.parti}`}>Partis {n('parti')}</span>
    </p>
  )
}

function CarteEnfant({ date, enfant: e, photo, agrandir }: { date: string; enfant: EnfantDuJour; photo: string | null; agrandir: () => void }) {
  const client = useQueryClient()
  const [enCours, setEnCours] = useState('')
  const [erreur, setErreur] = useState('')
  const recuperent = e.responsables.filter((r) => r.peutRecuperer)
  const prevenir = e.responsables.filter((r) => !r.peutRecuperer && r.estContact)
  const etat = e.pointage.etat

  async function pointer(etape: 'recupere' | 'absent' | 'parti' | 'annuler', avec?: { type: 'responsable' | 'personne'; id: number }) {
    setErreur('')
    setEnCours(avec ? `${avec.type}-${avec.id}` : etape)
    try {
      await appel('PUT', `/api/encadrant/garderie/${date}/${e.id}/pointage`, { etape, avec })
      await client.invalidateQueries({ queryKey: ['encadrant', 'garderie'] })
    } catch (err) {
      setErreur(err instanceof ErreurApi ? err.message : 'Enregistrement impossible, réessayez.')
    } finally {
      setEnCours('')
    }
  }

  const bouton = 'flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-semibold disabled:opacity-60'
  return (
    <li className="rounded-2xl border bg-white p-3">
      <div className="flex items-center gap-4">
        {photo ? (
          <button type="button" onClick={agrandir} aria-label={`Agrandir la photo de ${e.prenom}`} className="rounded-2xl">
            <PhotoEnfant src={photo} prenom={e.prenom} nom={e.nom} className="size-20" />
          </button>
        ) : (
          <PhotoEnfant src={null} prenom={e.prenom} nom={e.nom} className="size-20" />
        )}
        <div className="min-w-0">
          <p className="text-lg leading-tight font-bold">{e.prenom}</p>
          <p className="font-medium">{e.nom}</p>
          <p className="text-sm text-muted-foreground">
            {e.categorie ?? '—'}
            {!e.photo && ' · pas de photo'}
          </p>
        </div>
      </div>
      <p className={`mt-3 rounded-xl px-3 py-2 text-sm font-semibold ${TONS[etat]}`}>{libellePointage(e.pointage)}</p>
      {etat === 'absent' && <p className="mt-1 text-sm text-amber-900">Prévenez un responsable (numéros ci-dessous).</p>}
      <div className="mt-3 flex flex-wrap gap-2">
        {etat === 'demande' && (
          <>
            <button type="button" disabled={!!enCours} onClick={() => pointer('recupere')} className={`${bouton} border-sky-700 bg-sky-700 text-white`}>
              <Check className="size-4" aria-hidden /> Récupéré
            </button>
            <button type="button" disabled={!!enCours} onClick={() => pointer('absent')} className={`${bouton} bg-white`}>
              <UserX className="size-4" aria-hidden /> Absent
            </button>
          </>
        )}
        {etat === 'recupere' && (
          <div className="grid w-full gap-2">
            <p className="text-sm font-semibold">Parti avec :</p>
            <div className="flex flex-wrap gap-2">
              {recuperent.map((r) => (
                <button key={`r-${r.id}`} type="button" disabled={!!enCours} onClick={() => pointer('parti', { type: 'responsable', id: r.id })} className={`${bouton} bg-white`}>
                  {r.prenom} {r.nom}
                </button>
              ))}
              {e.personnes.map((p) => (
                <button key={`p-${p.id}`} type="button" disabled={!!enCours} onClick={() => pointer('parti', { type: 'personne', id: p.id })} className={`${bouton} bg-white`}>
                  {p.prenom} {p.nom}
                </button>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">Quelqu’un d’autre ? Ne confiez pas l’enfant : appelez un responsable, qui peut l’ajouter depuis son espace.</p>
          </div>
        )}
        {etat !== 'demande' && (
          <button type="button" disabled={!!enCours} onClick={() => pointer('annuler')} className={`${bouton} bg-white text-muted-foreground`}>
            <Undo2 className="size-4" aria-hidden /> {etat === 'parti' ? 'Annuler le départ' : 'Annuler'}
          </button>
        )}
      </div>
      {erreur && (
        <p role="alert" className="mt-2 text-sm font-medium text-brand">
          {erreur}
        </p>
      )}
      <details className="group mt-3 rounded-xl border">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 px-3 font-semibold">
          Qui peut venir le chercher ({recuperent.length + e.personnes.length})
          <ChevronDown className="size-4 transition-transform group-open:rotate-180" aria-hidden />
        </summary>
        <ul className="grid gap-2 border-t p-3">
          {recuperent.map((r) => (
            <Contact key={`r-${r.prenom}-${r.nom}`} nom={`${r.prenom} ${r.nom}`} role={QUALITES[r.qualite as Qualite] ?? r.qualite} telephone={r.telephone} />
          ))}
          {e.personnes.map((p) => (
            <Contact key={`p-${p.prenom}-${p.nom}`} nom={`${p.prenom} ${p.nom}`} role={p.lien} telephone={p.telephone} />
          ))}
          {recuperent.length + e.personnes.length === 0 && <li className="text-sm font-medium text-brand">Personne n’est autorisé : appelez le bureau.</li>}
          {prevenir.length > 0 && (
            <li className="mt-1 border-t pt-2 text-sm text-muted-foreground">
              À prévenir, mais ne peut pas le récupérer :
              <ul className="mt-1 grid gap-2">
                {prevenir.map((r) => (
                  <Contact key={`c-${r.prenom}-${r.nom}`} nom={`${r.prenom} ${r.nom}`} role={QUALITES[r.qualite as Qualite] ?? r.qualite} telephone={r.telephone} />
                ))}
              </ul>
            </li>
          )}
        </ul>
      </details>
    </li>
  )
}

function Contact({ nom, role, telephone }: { nom: string; role: string; telephone: string | null }) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
      <span className="min-w-36 flex-1">
        <span className="block font-medium text-foreground">{nom}</span>
        <span className="block text-sm text-muted-foreground">{role}</span>
      </span>
      {telephone && (
        <a
          href={`tel:${telephone.replace(/\s/g, '')}`}
          className="flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-3.5 text-sm font-semibold text-brand hover:bg-brand-soft"
        >
          <Phone className="size-4" aria-hidden /> {telephone}
        </a>
      )}
    </li>
  )
}
