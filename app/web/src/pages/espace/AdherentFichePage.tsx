import { useState, type FormEvent, type ReactNode } from 'react'
import { useNavigate, useParams } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Mail, Pencil, Phone, Plus, Trash2, UserCheck, UserPlus } from 'lucide-react'
import { Bloc, Espace } from '../../components/espace/Garde'
import { BlocAdhesion } from '../../components/espace/BlocAdhesion'
import { FormulaireAdherent } from '../../components/espace/FormulaireAdherent'
import { estMineur } from '../../content/adhesion'
import { LienConnexion } from '../../components/espace/LienConnexion'
import { Alerte, Bouton, Case, Champ, Selection } from '../../components/formulaire'
import {
  age,
  appel,
  dateFr,
  ErreurApi,
  QUALITES,
  type Compte,
  type FicheAdherent,
  type Qualite,
  type Responsable,
} from '../../lib/api'

const OPTIONS_QUALITE = (Object.keys(QUALITES) as Qualite[]).map((q) => ({ valeur: q, libelle: QUALITES[q] }))

export function AdherentFichePage() {
  const { id } = useParams({ from: '/espace/adherents/$id' })
  const client = useQueryClient()
  const cle = ['admin', 'adherent', id]
  const { data, isPending, isError } = useQuery({
    queryKey: cle,
    queryFn: () => appel<FicheAdherent>('GET', `/api/admin/adherents/${id}`),
  })
  const rafraichir = () => client.invalidateQueries({ queryKey: ['admin'] })

  return (
    <Espace
      titre={data ? `${data.adherent.prenom} ${data.adherent.nom}` : 'Fiche adhérent'}
      retour={{ to: '/espace/adherents', libelle: 'Adhérents' }}
      roles={['bureau', 'admin']}
      aide="responsables"
    >
      {() => {
        if (isPending) return <p className="text-muted-foreground">Chargement…</p>
        if (isError) return <Alerte>Adhérent introuvable.</Alerte>
        return (
          <div className="grid gap-6">
            <Identite fiche={data} rafraichir={rafraichir} />
            <Responsables fiche={data} rafraichir={rafraichir} />
            {!data.adherent.supprime_le && <BlocAdhesion adherentId={data.adherent.id} />}
            <PersonnesAutorisees fiche={data} rafraichir={rafraichir} />
          </div>
        )
      }}
    </Espace>
  )
}

type PropsBloc = { fiche: FicheAdherent; rafraichir: () => Promise<void> }

// --- Identité ---

function Identite({ fiche, rafraichir }: PropsBloc) {
  const a = fiche.adherent
  const navigate = useNavigate()
  const [edition, setEdition] = useState(false)
  const [confirmer, setConfirmer] = useState(false)
  const [erreur, setErreur] = useState('')

  if (a.supprime_le) {
    return (
      <Bloc titre="Adhérent supprimé">
        <p className="mb-4 text-muted-foreground">Cette fiche a été supprimée le {dateFr(a.supprime_le.slice(0, 10))}.</p>
        <Bouton
          variante="secondaire"
          onClick={async () => {
            await appel('POST', `/api/admin/adherents/${a.id}/restaurer`)
            await rafraichir()
          }}
        >
          Restaurer la fiche
        </Bouton>
      </Bloc>
    )
  }

  if (edition) {
    return (
      <Bloc titre="Modifier l’identité">
        <FormulaireAdherent
          initial={a}
          libelleValider="Enregistrer"
          annuler={() => setEdition(false)}
          enregistrer={async (saisie) => {
            await appel('PUT', `/api/admin/adherents/${a.id}`, saisie)
            await rafraichir()
            setEdition(false)
          }}
        />
      </Bloc>
    )
  }

  const lignes: [string, ReactNode][] = [
    ['Né·e le', `${dateFr(a.date_naissance)} (${age(a.date_naissance)} ans)`],
    ['Sexe', a.sexe === 'F' ? 'Féminin' : 'Masculin'],
    ['Ceinture', a.grade ?? '—'],
    ['N° de licence', a.numero_licence ?? '—'],
    ['Adresse', [a.adresse, [a.code_postal, a.ville].filter(Boolean).join(' ')].filter(Boolean).join(', ') || '—'],
  ]
  return (
    <Bloc
      titre="Identité"
      action={
        <Bouton variante="secondaire" onClick={() => setEdition(true)}>
          <Pencil className="size-4" aria-hidden /> Modifier
        </Bouton>
      }
    >
      <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
        {lignes.map(([l, v]) => (
          <div key={l}>
            <dt className="text-sm text-muted-foreground">{l}</dt>
            <dd className="font-medium">{v}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-6 border-t pt-4">
        {confirmer ? (
          <div className="grid gap-3">
            <p className="text-sm">
              Supprimer la fiche de <strong>{a.prenom}</strong> ? Elle reste restaurable.
            </p>
            <Alerte>{erreur}</Alerte>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Bouton
                variante="danger"
                onClick={async () => {
                  try {
                    await appel('DELETE', `/api/admin/adherents/${a.id}`)
                    await rafraichir()
                    navigate({ to: '/espace/adherents' })
                  } catch (err) {
                    setErreur(err instanceof ErreurApi ? err.message : 'Suppression impossible.')
                  }
                }}
              >
                Confirmer la suppression
              </Bouton>
              <Bouton variante="secondaire" onClick={() => setConfirmer(false)}>
                Annuler
              </Bouton>
            </div>
          </div>
        ) : (
          <button type="button" onClick={() => setConfirmer(true)} className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand">
            <Trash2 className="size-4" aria-hidden /> Supprimer l’adhérent
          </button>
        )}
      </div>
    </Bloc>
  )
}

// --- Responsables légaux ---

type Capacites = { qualite: Qualite | ''; peut_inscrire: boolean; peut_recuperer: boolean; est_contact: boolean }
const CAPACITES_DEFAUT: Capacites = { qualite: '', peut_inscrire: true, peut_recuperer: true, est_contact: true }

function ChoixCapacites({
  prefixe,
  valeur,
  onChange,
  erreur,
}: {
  prefixe: string
  valeur: Capacites
  onChange: (v: Capacites) => void
  erreur?: string
}) {
  return (
    <div className="grid gap-3">
      <Selection
        id={`${prefixe}-qualite`}
        libelle="Lien avec l’enfant"
        requis
        valeur={valeur.qualite}
        options={OPTIONS_QUALITE}
        onChange={(q) => onChange({ ...valeur, qualite: q })}
        erreur={erreur}
      />
      <Case
        id={`${prefixe}-peut_inscrire`}
        libelle="Peut inscrire l’enfant"
        aide="Compétitions, garderie du mercredi"
        coche={valeur.peut_inscrire}
        onChange={(v) => onChange({ ...valeur, peut_inscrire: v })}
      />
      <Case
        id={`${prefixe}-peut_recuperer`}
        libelle="Peut récupérer l’enfant"
        aide="Garderie, fin de cours"
        coche={valeur.peut_recuperer}
        onChange={(v) => onChange({ ...valeur, peut_recuperer: v })}
      />
      <Case id={`${prefixe}-est_contact`} libelle="Prévenu par le club" coche={valeur.est_contact} onChange={(v) => onChange({ ...valeur, est_contact: v })} />
    </div>
  )
}

function Responsables({ fiche, rafraichir }: PropsBloc) {
  // Ressaisie : un mineur sans responsable → formulaire d'ajout ouvert d'emblée.
  const [ajout, setAjout] = useState(() => fiche.responsables.length === 0 && estMineur(fiche.adherent.date_naissance))
  const inactif = !!fiche.adherent.supprime_le
  return (
    <Bloc
      titre="Responsables légaux"
      action={
        !ajout &&
        !inactif && (
          <Bouton variante="secondaire" onClick={() => setAjout(true)}>
            <UserPlus className="size-4" aria-hidden /> Ajouter
          </Bouton>
        )
      }
    >
      {fiche.responsables.length === 0 && !ajout && (
        <p className="text-muted-foreground">Aucun responsable : ajoutez au moins un parent ou tuteur.</p>
      )}
      <ul className="grid gap-3">
        {fiche.responsables.map((r) => (
          <LigneResponsable key={r.id} adherentId={fiche.adherent.id} r={r} rafraichir={rafraichir} />
        ))}
      </ul>
      {ajout && <AjoutResponsable adherentId={fiche.adherent.id} fermer={() => setAjout(false)} rafraichir={rafraichir} />}
    </Bloc>
  )
}

function LigneResponsable({ adherentId, r, rafraichir }: { adherentId: number; r: Responsable; rafraichir: () => Promise<void> }) {
  const [edition, setEdition] = useState(false)
  const [lien, setLien] = useState(false)
  const [cap, setCap] = useState<Capacites>({
    qualite: r.qualite,
    peut_inscrire: !!r.peut_inscrire,
    peut_recuperer: !!r.peut_recuperer,
    est_contact: !!r.est_contact,
  })
  const [erreur, setErreur] = useState('')
  const url = `/api/admin/adherents/${adherentId}/responsables/${r.id}`
  const puces = [r.peut_inscrire && 'Inscrit', r.peut_recuperer && 'Récupère', r.est_contact && 'Prévenu'].filter(Boolean) as string[]

  return (
    <li className="rounded-xl border p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-semibold">
            {r.prenom} {r.nom} <span className="font-normal text-muted-foreground">· {QUALITES[r.qualite]}</span>
          </p>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            {r.telephone && (
              <a href={`tel:${r.telephone.replace(/\s/g, '')}`} className="inline-flex items-center gap-1 hover:text-brand">
                <Phone className="size-3.5" aria-hidden /> {r.telephone}
              </a>
            )}
            {r.email && (
              <span className="inline-flex items-center gap-1 break-all">
                <Mail className="size-3.5" aria-hidden /> {r.email}
              </span>
            )}
          </div>
        </div>
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
            r.compte_active ? 'bg-emerald-50 text-emerald-700' : 'bg-surface text-muted-foreground'
          }`}
        >
          {r.compte_active ? <UserCheck className="size-3.5" aria-hidden /> : null}
          {r.compte_active ? 'Compte activé' : 'Pas encore connecté'}
        </span>
      </div>
      {!edition && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {puces.map((p) => (
            <span key={p} className="rounded-full bg-brand-soft px-2.5 py-1 text-xs font-semibold text-brand">
              {p}
            </span>
          ))}
          <span className="ml-auto flex gap-4">
            <button type="button" aria-expanded={lien} onClick={() => setLien((v) => !v)} className="text-sm font-semibold text-brand">
              Lien de connexion
            </button>
            <button type="button" onClick={() => setEdition(true)} className="text-sm font-semibold text-brand">
              Modifier
            </button>
          </span>
        </div>
      )}
      {lien && !edition && (
        <div className="mt-4">
          <LienConnexion compte={r} />
        </div>
      )}
      {edition && (
        <div className="mt-4 grid gap-3">
          <ChoixCapacites prefixe={`r${r.id}`} valeur={cap} onChange={setCap} />
          <Alerte>{erreur}</Alerte>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Bouton
              onClick={async () => {
                try {
                  await appel('PUT', url, cap)
                  await rafraichir()
                  setEdition(false)
                } catch (err) {
                  setErreur(err instanceof ErreurApi ? err.message : 'Enregistrement impossible.')
                }
              }}
            >
              Enregistrer
            </Bouton>
            <Bouton variante="secondaire" onClick={() => setEdition(false)}>
              Annuler
            </Bouton>
            <Bouton
              variante="danger"
              onClick={async () => {
                await appel('DELETE', url)
                await rafraichir()
              }}
            >
              Retirer ce responsable
            </Bouton>
          </div>
        </div>
      )}
    </li>
  )
}

function AjoutResponsable({ adherentId, fermer, rafraichir }: { adherentId: number; fermer: () => void; rafraichir: () => Promise<void> }) {
  const [mode, setMode] = useState<'existant' | 'nouveau'>('existant')
  const [q, setQ] = useState('')
  const [choisi, setChoisi] = useState<Compte | null>(null)
  const [nouveau, setNouveau] = useState({ prenom: '', nom: '', email: '', telephone: '' })
  const [cap, setCap] = useState<Capacites>(CAPACITES_DEFAUT)
  const [erreurs, setErreurs] = useState<Record<string, string>>({})
  const [message, setMessage] = useState('')
  const [compteExistant, setCompteExistant] = useState<number | null>(null)
  const [enCours, setEnCours] = useState(false)

  const recherche = useQuery({
    queryKey: ['admin', 'comptes', q.trim()],
    queryFn: () => appel<Compte[]>('GET', `/api/admin/comptes?q=${encodeURIComponent(q.trim())}`),
    enabled: mode === 'existant' && q.trim().length >= 2,
  })

  async function lier(userId: number) {
    await appel('PUT', `/api/admin/adherents/${adherentId}/responsables/${userId}`, cap)
    await rafraichir()
    fermer()
  }

  async function valider(e: FormEvent) {
    e.preventDefault()
    setErreurs({})
    setMessage('')
    setCompteExistant(null)
    if (!cap.qualite) {
      setErreurs({ qualite: 'Lien avec l’enfant obligatoire' })
      return
    }
    setEnCours(true)
    try {
      if (mode === 'existant') {
        if (!choisi) {
          setMessage('Choisissez un compte dans la liste.')
          return
        }
        await lier(choisi.id)
      } else {
        const { id } = await appel<{ id: number }>('POST', '/api/admin/comptes', nouveau)
        await lier(id)
      }
    } catch (err) {
      if (err instanceof ErreurApi) {
        setErreurs(err.erreurs)
        setMessage(err.message)
        // E-mail déjà connu : le compte existe, on propose de le lier plutôt que d'en créer un doublon.
        if (err.statut === 409 && typeof err.corps.id === 'number') setCompteExistant(err.corps.id)
      } else setMessage('Enregistrement impossible.')
    } finally {
      setEnCours(false)
    }
  }

  return (
    <form onSubmit={valider} className="mt-4 grid gap-4 rounded-xl border border-dashed p-4" noValidate>
      <div className="flex gap-2" role="group" aria-label="Type de responsable">
        {(
          [
            ['existant', 'Compte existant'],
            ['nouveau', 'Nouveau parent'],
          ] as const
        ).map(([m, l]) => (
          <button
            key={m}
            type="button"
            aria-pressed={mode === m}
            onClick={() => setMode(m)}
            className="rounded-full border px-4 py-2 text-sm font-semibold aria-pressed:border-ink aria-pressed:bg-ink aria-pressed:text-white"
          >
            {l}
          </button>
        ))}
      </div>

      {mode === 'existant' ? (
        <div className="grid gap-2">
          <Champ id="recherche-compte" libelle="Rechercher un parent" valeur={q} onChange={setQ} aide="Nom, prénom ou e-mail (2 lettres minimum)" />
          {choisi && (
            <p className="rounded-xl bg-brand-soft px-3.5 py-2.5 text-sm">
              Sélectionné : <strong>{choisi.prenom} {choisi.nom}</strong>
            </p>
          )}
          {recherche.data && (
            <ul className="max-h-60 divide-y overflow-y-auto rounded-xl border">
              {recherche.data.map((c) => (
                <li key={c.id}>
                  <button type="button" onClick={() => setChoisi(c)} className="w-full px-3.5 py-2.5 text-left hover:bg-surface">
                    <span className="font-semibold">
                      {c.prenom} {c.nom}
                    </span>
                    <span className="block text-sm text-muted-foreground">{c.email ?? c.telephone ?? ''}</span>
                  </button>
                </li>
              ))}
              {recherche.data.length === 0 && <li className="px-3.5 py-2.5 text-sm text-muted-foreground">Aucun compte : créez un nouveau parent.</li>}
            </ul>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <Champ id="n-prenom" libelle="Prénom" requis valeur={nouveau.prenom} onChange={(v) => setNouveau((p) => ({ ...p, prenom: v }))} erreur={erreurs.prenom} />
          <Champ id="n-nom" libelle="Nom" requis valeur={nouveau.nom} onChange={(v) => setNouveau((p) => ({ ...p, nom: v }))} erreur={erreurs.nom} />
          <Champ
            id="n-email"
            libelle="E-mail"
            type="email"
            valeur={nouveau.email}
            onChange={(v) => setNouveau((p) => ({ ...p, email: v }))}
            erreur={erreurs.email}
            aide="Servira à l’invitation au site"
          />
          <Champ
            id="n-telephone"
            libelle="Téléphone"
            type="tel"
            valeur={nouveau.telephone}
            onChange={(v) => setNouveau((p) => ({ ...p, telephone: v }))}
            erreur={erreurs.telephone}
          />
        </div>
      )}

      <ChoixCapacites prefixe="ajout" valeur={cap} onChange={setCap} erreur={erreurs.qualite} />
      <Alerte>{message}</Alerte>
      {compteExistant && (
        <Bouton
          variante="secondaire"
          onClick={() => lier(compteExistant).catch((err) => setMessage(err instanceof ErreurApi ? err.message : 'Enregistrement impossible.'))}
        >
          Lier le compte existant
        </Bouton>
      )}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Bouton type="submit" enCours={enCours}>
          <Plus className="size-4" aria-hidden /> Ajouter le responsable
        </Bouton>
        <Bouton variante="secondaire" onClick={fermer}>
          Annuler
        </Bouton>
      </div>
    </form>
  )
}

// --- Personnes autorisées à récupérer l'enfant ---

function PersonnesAutorisees({ fiche, rafraichir }: PropsBloc) {
  const [ajout, setAjout] = useState(false)
  const [s, setS] = useState({ prenom: '', nom: '', lien: '', telephone: '' })
  const [erreurs, setErreurs] = useState<Record<string, string>>({})
  const [enCours, setEnCours] = useState(false)
  const base = `/api/admin/adherents/${fiche.adherent.id}/personnes-autorisees`

  async function ajouter(e: FormEvent) {
    e.preventDefault()
    setEnCours(true)
    setErreurs({})
    try {
      await appel('POST', base, s)
      await rafraichir()
      setS({ prenom: '', nom: '', lien: '', telephone: '' })
      setAjout(false)
    } catch (err) {
      if (err instanceof ErreurApi) setErreurs(err.erreurs)
    } finally {
      setEnCours(false)
    }
  }

  return (
    <Bloc
      titre="Autorisés à récupérer l’enfant"
      action={
        !ajout &&
        !fiche.adherent.supprime_le && (
          <Bouton variante="secondaire" onClick={() => setAjout(true)}>
            <Plus className="size-4" aria-hidden /> Ajouter
          </Bouton>
        )
      }
    >
      <p className="mb-3 text-sm text-muted-foreground">Personnes sans compte (grands-parents, nounou…), en plus des responsables.</p>
      <ul className="grid gap-2">
        {fiche.personnesAutorisees.map((p) => (
          <li key={p.id} className="flex items-center justify-between gap-3 rounded-xl border px-4 py-3">
            <span>
              <span className="font-semibold">
                {p.prenom} {p.nom}
              </span>
              <span className="text-muted-foreground"> · {p.lien}</span>
              {p.telephone && <span className="block text-sm text-muted-foreground">{p.telephone}</span>}
            </span>
            <button
              type="button"
              aria-label={`Retirer ${p.prenom} ${p.nom}`}
              onClick={async () => {
                await appel('DELETE', `${base}/${p.id}`)
                await rafraichir()
              }}
              className="flex size-10 items-center justify-center rounded-full text-muted-foreground hover:bg-brand-soft hover:text-brand"
            >
              <Trash2 className="size-4" aria-hidden />
            </button>
          </li>
        ))}
        {fiche.personnesAutorisees.length === 0 && !ajout && <li className="text-muted-foreground">Aucune personne autorisée.</li>}
      </ul>
      {ajout && (
        <form onSubmit={ajouter} className="mt-4 grid gap-4 rounded-xl border border-dashed p-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <Champ id="pa-prenom" libelle="Prénom" requis valeur={s.prenom} onChange={(v) => setS((p) => ({ ...p, prenom: v }))} erreur={erreurs.prenom} />
            <Champ id="pa-nom" libelle="Nom" requis valeur={s.nom} onChange={(v) => setS((p) => ({ ...p, nom: v }))} erreur={erreurs.nom} />
            <Champ
              id="pa-lien"
              libelle="Lien avec l’enfant"
              requis
              valeur={s.lien}
              onChange={(v) => setS((p) => ({ ...p, lien: v }))}
              erreur={erreurs.lien}
              aide="Ex. grand-mère, nounou"
            />
            <Champ
              id="pa-telephone"
              libelle="Téléphone"
              type="tel"
              valeur={s.telephone}
              onChange={(v) => setS((p) => ({ ...p, telephone: v }))}
              erreur={erreurs.telephone}
            />
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Bouton type="submit" enCours={enCours}>
              Ajouter
            </Bouton>
            <Bouton variante="secondaire" onClick={() => setAjout(false)}>
              Annuler
            </Bouton>
          </div>
        </form>
      )}
    </Bloc>
  )
}
