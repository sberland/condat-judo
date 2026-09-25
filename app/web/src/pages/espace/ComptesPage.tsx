import { useState, type FormEvent } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Download, LogOut, Mail, Phone, Plus, Search, Trash2, UserCheck } from 'lucide-react'
import { Bloc, Espace } from '../../components/espace/Garde'
import { LienConnexion } from '../../components/espace/LienConnexion'
import { Alerte, Bouton, Case, Champ } from '../../components/formulaire'
import { aUnRole, appel, ErreurApi, ROLES, type Compte, type Me, type Role } from '../../lib/api'
import { slug, telechargerJson } from '../../lib/csv'

type SaisieCompte = { prenom: string; nom: string; email: string; telephone: string }
const VIDE: SaisieCompte = { prenom: '', nom: '', email: '', telephone: '' }

export function ComptesPage() {
  const [q, setQ] = useState('')
  const [creation, setCreation] = useState(false)
  const { data, isPending, isError } = useQuery({
    queryKey: ['admin', 'comptes'],
    queryFn: () => appel<Compte[]>('GET', '/api/admin/comptes'),
  })

  const terme = q.trim().toLowerCase()
  const liste = (data ?? []).filter((c) => `${c.prenom} ${c.nom} ${c.nom} ${c.email ?? ''}`.toLowerCase().includes(terme))

  return (
    <Espace titre="Comptes" retour={{ to: '/espace', libelle: 'Mon espace' }} roles={['bureau', 'admin']} aide="comptes">
      {(me) => (
        <div className="grid gap-4">
          <p className="text-muted-foreground">
            Parents, adhérents majeurs et membres du bureau. Pour qu’une personne se connecte, envoyez-lui un lien de connexion
            (Modifier → Connexion au site).
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <label className="relative flex-1">
              <span className="sr-only">Rechercher un compte</span>
              <Search className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <input
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Nom ou e-mail…"
                className="min-h-12 w-full rounded-xl border bg-white pr-3.5 pl-11 text-base outline-none focus:border-brand"
              />
            </label>
            {!creation && (
              <Bouton onClick={() => setCreation(true)}>
                <Plus className="size-4" aria-hidden /> Nouveau compte
              </Bouton>
            )}
          </div>

          {creation && (
            <Bloc titre="Nouveau compte">
              <FormulaireCompte
                libelleValider="Créer le compte"
                annuler={() => setCreation(false)}
                enregistrer={async (s) => {
                  await appel('POST', '/api/admin/comptes', s)
                  setCreation(false)
                }}
              />
            </Bloc>
          )}

          {isPending && <p className="text-muted-foreground">Chargement…</p>}
          {isError && <p className="text-brand">Impossible de charger la liste.</p>}
          {data && (
            <p className="text-sm text-muted-foreground">
              {liste.length} compte{liste.length > 1 ? 's' : ''}
              {terme && ` sur ${data.length}`}
            </p>
          )}
          <ul className="grid gap-3">
            {liste.map((c) => (
              <LigneCompte key={c.id} compte={c} me={me} />
            ))}
            {data && liste.length === 0 && <li className="py-6 text-center text-muted-foreground">Aucun compte trouvé.</li>}
          </ul>
        </div>
      )}
    </Espace>
  )
}

function LigneCompte({ compte: c, me }: { compte: Compte; me: Me }) {
  const client = useQueryClient()
  const [ouvert, setOuvert] = useState(false)
  const rafraichir = () => client.invalidateQueries({ queryKey: ['admin'] })

  return (
    <li className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold">
            {c.prenom} {c.nom}
            {c.id === me.id && <span className="font-normal text-muted-foreground"> (vous)</span>}
          </p>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            {c.email && (
              <span className="inline-flex items-center gap-1 break-all">
                <Mail className="size-3.5 shrink-0" aria-hidden /> {c.email}
              </span>
            )}
            {c.telephone && (
              <span className="inline-flex items-center gap-1">
                <Phone className="size-3.5" aria-hidden /> {c.telephone}
              </span>
            )}
            <span>
              {c.enfants} adhérent{c.enfants > 1 ? 's' : ''} lié{c.enfants > 1 ? 's' : ''}
            </span>
          </div>
        </div>
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
            c.compte_active ? 'bg-emerald-50 text-emerald-700' : 'bg-surface text-muted-foreground'
          }`}
        >
          {c.compte_active && <UserCheck className="size-3.5" aria-hidden />}
          {c.compte_active ? 'Compte activé' : 'Pas encore connecté'}
        </span>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {c.roles.map((r) => (
          <span key={r} className="rounded-full bg-ink px-2.5 py-1 text-xs font-semibold text-white">
            {ROLES[r]?.libelle ?? r}
          </span>
        ))}
        {!ouvert && (
          <button type="button" onClick={() => setOuvert(true)} className="ml-auto text-sm font-semibold text-brand">
            Modifier
          </button>
        )}
      </div>
      {ouvert && (
        <div className="mt-4 grid gap-6 border-t pt-4">
          <FormulaireCompte
            prefixe={`c${c.id}`}
            initial={{ prenom: c.prenom, nom: c.nom, email: c.email ?? '', telephone: c.telephone ?? '' }}
            libelleValider="Enregistrer"
            annuler={() => setOuvert(false)}
            enregistrer={async (s) => {
              await appel('PUT', `/api/admin/comptes/${c.id}`, s)
              await rafraichir()
              setOuvert(false)
            }}
          />
          <Connexion compte={c} me={me} rafraichir={rafraichir} />
          {aUnRole(me, 'admin') && <Roles compte={c} rafraichir={rafraichir} />}
          {aUnRole(me, 'admin') && <ExportDonnees compte={c} />}
          {c.id !== me.id && <Suppression compte={c} rafraichir={rafraichir} />}
        </div>
      )}
    </li>
  )
}

function FormulaireCompte({
  prefixe = 'nouveau',
  initial = VIDE,
  libelleValider,
  enregistrer,
  annuler,
}: {
  prefixe?: string
  initial?: SaisieCompte
  libelleValider: string
  enregistrer: (s: SaisieCompte) => Promise<void>
  annuler: () => void
}) {
  const client = useQueryClient()
  const [s, setS] = useState(initial)
  const [erreurs, setErreurs] = useState<Record<string, string>>({})
  const [message, setMessage] = useState('')
  const [enCours, setEnCours] = useState(false)
  const maj = (champ: keyof SaisieCompte) => (v: string) => setS((p) => ({ ...p, [champ]: v }))

  async function soumettre(e: FormEvent) {
    e.preventDefault()
    setEnCours(true)
    setErreurs({})
    setMessage('')
    try {
      await enregistrer(s)
      await client.invalidateQueries({ queryKey: ['admin'] })
    } catch (err) {
      if (err instanceof ErreurApi) {
        setErreurs(err.erreurs)
        setMessage(err.message)
      } else setMessage('Enregistrement impossible, réessayez.')
    } finally {
      setEnCours(false)
    }
  }

  return (
    <form onSubmit={soumettre} className="grid gap-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Champ id={`${prefixe}-prenom`} libelle="Prénom" requis valeur={s.prenom} onChange={maj('prenom')} erreur={erreurs.prenom} autoComplete="off" />
        <Champ id={`${prefixe}-nom`} libelle="Nom" requis valeur={s.nom} onChange={maj('nom')} erreur={erreurs.nom} autoComplete="off" />
        <Champ
          id={`${prefixe}-email`}
          libelle="E-mail"
          type="email"
          valeur={s.email}
          onChange={maj('email')}
          erreur={erreurs.email}
          autoComplete="off"
          aide="Servira à la connexion au site"
        />
        <Champ id={`${prefixe}-telephone`} libelle="Téléphone" type="tel" valeur={s.telephone} onChange={maj('telephone')} erreur={erreurs.telephone} />
      </div>
      <p className="text-sm text-muted-foreground">E-mail ou téléphone : au moins l’un des deux.</p>
      <Alerte>{message}</Alerte>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Bouton type="submit" enCours={enCours}>
          {libelleValider}
        </Bouton>
        <Bouton variante="secondaire" onClick={annuler}>
          Annuler
        </Bouton>
      </div>
    </form>
  )
}

function Connexion({ compte, me, rafraichir }: { compte: Compte; me: Me; rafraichir: () => Promise<void> }) {
  const [message, setMessage] = useState('')
  // Même règle que l'API : un lien connecte à la place de la personne → admin seul pour un compte qui a un rôle.
  const peutCreerLien = aUnRole(me, 'admin') || compte.roles.length === 0
  const n = compte.sessions
  const p = compte.passkeys

  return (
    <div className="grid gap-3">
      <h3 className="font-bold">Connexion au site</h3>
      {peutCreerLien ? (
        <LienConnexion compte={compte} />
      ) : (
        <p className="text-sm text-muted-foreground">Seul un administrateur peut créer un lien pour un compte du bureau.</p>
      )}
      {(n > 0 || p > 0) && (
        <div className="grid gap-2">
          <p className="text-sm text-muted-foreground">
            {n > 0 ? `Connecté·e sur ${n} appareil${n > 1 ? 's' : ''}` : 'Aucune session ouverte'}
            {p > 0 && ` · ${p} passkey${p > 1 ? 's' : ''} (Face ID, empreinte)`}. Téléphone perdu ou changé ? Coupez
            l’accès :
          </p>
          <Bouton
            variante="danger"
            onClick={async () => {
              setMessage('')
              try {
                await appel('DELETE', `/api/admin/comptes/${compte.id}/sessions`)
                await rafraichir()
              } catch (err) {
                setMessage(err instanceof ErreurApi ? err.message : 'Déconnexion impossible.')
              }
            }}
          >
            <LogOut className="size-4" aria-hidden /> Déconnecter {compte.id === me.id ? 'tous mes appareils' : 'tous ses appareils'}
          </Bouton>
          <Alerte>{message}</Alerte>
        </div>
      )}
    </div>
  )
}

function Roles({ compte, rafraichir }: { compte: Compte; rafraichir: () => Promise<void> }) {
  const [roles, setRoles] = useState<Role[]>(compte.roles)
  const [message, setMessage] = useState('')
  const [enCours, setEnCours] = useState(false)
  const modifie = [...roles].sort().join() !== [...compte.roles].sort().join()

  return (
    <div className="grid gap-3">
      <h3 className="font-bold">Rôles au club</h3>
      <div className="grid gap-2 sm:grid-cols-2">
        {(Object.keys(ROLES) as Role[]).map((r) => (
          <Case
            key={r}
            id={`c${compte.id}-role-${r}`}
            libelle={ROLES[r].libelle}
            aide={ROLES[r].description}
            coche={roles.includes(r)}
            onChange={(v) => setRoles((p) => (v ? [...p, r] : p.filter((x) => x !== r)))}
          />
        ))}
      </div>
      <Alerte>{message}</Alerte>
      {modifie && (
        <Bouton
          enCours={enCours}
          onClick={async () => {
            setEnCours(true)
            setMessage('')
            try {
              await appel('PUT', `/api/admin/comptes/${compte.id}/roles`, { roles })
              await rafraichir()
            } catch (err) {
              setMessage(err instanceof ErreurApi ? err.message : 'Enregistrement impossible.')
            } finally {
              setEnCours(false)
            }
          }}
        >
          Enregistrer les rôles
        </Bouton>
      )}
    </div>
  )
}

function Suppression({ compte, rafraichir }: { compte: Compte; rafraichir: () => Promise<void> }) {
  const [confirmer, setConfirmer] = useState(false)
  const [message, setMessage] = useState('')

  if (!confirmer) {
    return (
      <button type="button" onClick={() => setConfirmer(true)} className="inline-flex items-center gap-1.5 justify-self-start text-sm font-semibold text-brand">
        <Trash2 className="size-4" aria-hidden /> Supprimer le compte
      </button>
    )
  }
  return (
    <div className="grid gap-3">
      <p className="text-sm">
        Supprimer le compte de <strong>{compte.prenom} {compte.nom}</strong> ?
        {compte.enfants > 0 && ` Il ne sera plus responsable de ses ${compte.enfants} adhérent${compte.enfants > 1 ? 's' : ''}.`}
      </p>
      <Alerte>{message}</Alerte>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Bouton
          variante="danger"
          onClick={async () => {
            try {
              await appel('DELETE', `/api/admin/comptes/${compte.id}`)
              await rafraichir()
            } catch (err) {
              setMessage(err instanceof ErreurApi ? err.message : 'Suppression impossible.')
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
  )
}

/** Réponse à une demande d'accès reçue par écrit (spec 019) : toutes les données du compte. */
function ExportDonnees({ compte }: { compte: Compte }) {
  const [erreur, setErreur] = useState('')
  return (
    <div className="grid gap-2">
      <h3 className="font-semibold">Données personnelles</h3>
      <p className="text-sm text-muted-foreground">
        Pour répondre à une demande écrite : toutes les données du compte et des adhérents qui lui sont liés. La consultation est notée au
        journal.
      </p>
      <div>
        <Bouton
          variante="secondaire"
          onClick={async () => {
            setErreur('')
            try {
              const donnees = await appel<unknown>('GET', `/api/admin/comptes/${compte.id}/export`)
              telechargerJson(`donnees-${slug(`${compte.prenom} ${compte.nom}`)}-${new Date().toISOString().slice(0, 10)}.json`, donnees)
            } catch (err) {
              setErreur(err instanceof ErreurApi ? err.message : 'Export impossible.')
            }
          }}
        >
          <Download className="size-4" aria-hidden /> Exporter ses données
        </Bouton>
      </div>
      <Alerte>{erreur}</Alerte>
    </div>
  )
}
