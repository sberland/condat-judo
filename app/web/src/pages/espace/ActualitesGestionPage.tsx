import { useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Camera, Check, ChevronRight, Copy, ExternalLink, Lock, MessageCircle, Plus, Trash2 } from 'lucide-react'
import { Bloc, Espace } from '../../components/espace/Garde'
import { Alerte, Bouton, Case, Champ, LienBouton } from '../../components/formulaire'
import { MAX_TEXTE_ACTUALITE, VISIBILITES, type StatutActualite, type Visibilite } from '../../content/actualites'
import { appel, ErreurApi, urlWhatsApp } from '../../lib/api'
import { datePublication, imageActualite, messageWhatsApp, urlActualite, type ActualiteGestion } from '../../lib/actualites'
import { PHOTO_ACTUALITE, reduirePhoto } from '../../lib/photo'

// Actualités (spec 013), côté bureau et gestion du site : rédiger, publier, illustrer, partager.

const ROLES = ['bureau', 'contenu', 'admin'] as const
const REFUS = 'Cette page est réservée au bureau et à la personne qui gère le site.'

export function ActualitesGestionPage() {
  const client = useQueryClient()
  const navigate = useNavigate()
  const [creation, setCreation] = useState(false)
  const { data, isPending, isError } = useQuery({
    queryKey: ['actualites-gestion'],
    queryFn: () => appel<ActualiteGestion[]>('GET', '/api/actualites/gestion'),
  })

  return (
    <Espace titre="Actualités" retour={{ to: '/espace', libelle: 'Mon espace' }} roles={[...ROLES]} refus={REFUS} aide="actualites">
      {() => (
        <div className="grid grid-cols-1 gap-6">
          {creation ? (
            <Bloc titre="Nouvelle actualité">
              <FormulaireActualite
                onEnregistre={async (id) => {
                  await client.invalidateQueries({ queryKey: ['actualites-gestion'] })
                  navigate({ to: '/espace/actualites/$id', params: { id: String(id) } })
                }}
                onAnnule={() => setCreation(false)}
              />
            </Bloc>
          ) : (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-muted-foreground">Rédigez l’actualité, ajoutez une photo, publiez-la, puis partagez son lien dans le groupe WhatsApp.</p>
              <Bouton onClick={() => setCreation(true)}>
                <Plus className="size-4" aria-hidden /> Nouvelle actualité
              </Bouton>
            </div>
          )}
          {isPending && <p className="text-muted-foreground">Chargement…</p>}
          {isError && <Alerte>Impossible de charger les actualités.</Alerte>}
          {data && (
            <ul className="divide-y overflow-hidden rounded-2xl border bg-white shadow-sm">
              {data.map((a) => (
                <li key={a.id}>
                  <Link to="/espace/actualites/$id" params={{ id: String(a.id) }} className="flex items-center gap-3 px-4 py-3.5 hover:bg-surface">
                    {a.image ? (
                      <img src={imageActualite(a, true)} alt="" className="size-14 shrink-0 rounded-xl bg-surface object-cover" />
                    ) : (
                      <span className="size-14 shrink-0 rounded-xl bg-surface" aria-hidden />
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold">{a.titre}</span>
                        {a.statut === 'brouillon' ? (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900">Brouillon</span>
                        ) : (
                          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-800">Publiée</span>
                        )}
                        {a.visibilite === 'familles' && <Lock className="size-3.5 text-brand" aria-label="Réservée aux familles" />}
                      </span>
                      <span className="block text-sm text-muted-foreground">
                        {a.publiee_le ? `Publiée le ${datePublication(a.publiee_le)}` : 'Pas encore publiée'}
                        {a.auteur ? ` · ${a.auteur}` : ''}
                      </span>
                    </span>
                    <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden />
                  </Link>
                </li>
              ))}
              {data.length === 0 && <li className="px-4 py-6 text-center text-muted-foreground">Aucune actualité pour l’instant.</li>}
            </ul>
          )}
        </div>
      )}
    </Espace>
  )
}

type Saisie = { titre: string; texte: string; visibilite: Visibilite; statut: StatutActualite }

function FormulaireActualite({
  actualite,
  onEnregistre,
  onAnnule,
}: {
  actualite?: ActualiteGestion
  onEnregistre: (id: number) => void
  onAnnule?: () => void
}) {
  const [s, setS] = useState<Saisie>(
    actualite ? { titre: actualite.titre, texte: actualite.texte, visibilite: actualite.visibilite, statut: actualite.statut } : { titre: '', texte: '', visibilite: 'public', statut: 'brouillon' },
  )
  const [erreurs, setErreurs] = useState<Record<string, string>>({})
  const [erreur, setErreur] = useState('')
  const [enCours, setEnCours] = useState(false)
  const maj = <K extends keyof Saisie>(k: K) => (v: Saisie[K]) => setS((p) => ({ ...p, [k]: v }))
  const p = actualite ? `actualite-${actualite.id}` : 'actualite-nouvelle'

  async function enregistrer(ev: FormEvent) {
    ev.preventDefault()
    setEnCours(true)
    setErreurs({})
    setErreur('')
    try {
      if (actualite) {
        await appel('PUT', `/api/actualites/gestion/${actualite.id}`, s)
        onEnregistre(actualite.id)
      } else {
        const r = await appel<{ id: number }>('POST', '/api/actualites/gestion', s)
        onEnregistre(r.id)
      }
    } catch (err) {
      if (err instanceof ErreurApi) {
        setErreurs(err.erreurs)
        setErreur(Object.keys(err.erreurs).length ? 'Vérifiez les champs signalés.' : err.message)
      } else setErreur('Enregistrement impossible.')
    } finally {
      setEnCours(false)
    }
  }

  const radio = (nom: string, valeur: boolean, onChange: () => void, libelle: string, aide?: string) => (
    <label key={libelle} className={`flex min-h-12 cursor-pointer items-start gap-3 rounded-xl border px-3.5 py-3 ${valeur ? 'border-ink ring-1 ring-ink' : 'bg-white'}`}>
      <input type="radio" name={nom} checked={valeur} onChange={onChange} className="mt-0.5 size-5 shrink-0 accent-brand" />
      <span>
        <span className="block font-medium">{libelle}</span>
        {aide && <span className="block text-sm text-muted-foreground">{aide}</span>}
      </span>
    </label>
  )

  return (
    <form onSubmit={enregistrer} className="grid gap-4" noValidate>
      <Champ id={`${p}-titre`} libelle="Titre" valeur={s.titre} onChange={maj('titre')} erreur={erreurs.titre} requis />
      <div>
        <label htmlFor={`${p}-texte`} className="mb-1.5 block text-sm font-semibold">
          Texte <span className="text-brand">*</span>
        </label>
        <textarea
          id={`${p}-texte`}
          rows={10}
          value={s.texte}
          onChange={(e) => maj('texte')(e.target.value)}
          aria-invalid={!!erreurs.texte}
          className="block w-full rounded-xl border bg-white px-3.5 py-3 text-base outline-none focus:border-brand aria-[invalid=true]:border-brand"
        />
        <p className="mt-1 text-sm text-muted-foreground">
          Laissez une ligne vide entre deux paragraphes. {s.texte.length}/{MAX_TEXTE_ACTUALITE} caractères.
        </p>
        {erreurs.texte && <p className="mt-1 text-sm font-medium text-brand">{erreurs.texte}</p>}
      </div>
      <fieldset className="grid gap-2">
        <legend className="mb-1.5 text-sm font-semibold">Qui peut la lire ?</legend>
        {(Object.keys(VISIBILITES) as Visibilite[]).map((v) =>
          radio(`${p}-visibilite`, s.visibilite === v, () => maj('visibilite')(v), VISIBILITES[v], v === 'public' ? 'Tout le monde, sur le site.' : 'Les familles connectées à leur espace.'),
        )}
      </fieldset>
      <fieldset className="grid gap-2">
        <legend className="mb-1.5 text-sm font-semibold">Statut</legend>
        {radio(`${p}-statut`, s.statut === 'brouillon', () => maj('statut')('brouillon'), 'Brouillon', 'Visible seulement ici, pour la préparer.')}
        {radio(`${p}-statut`, s.statut === 'publiee', () => maj('statut')('publiee'), 'Publiée', 'En ligne sur le site et sur l’accueil.')}
      </fieldset>
      <Alerte>{erreur}</Alerte>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Bouton type="submit" enCours={enCours}>
          {actualite ? 'Enregistrer' : 'Créer l’actualité'}
        </Bouton>
        {onAnnule && (
          <Bouton variante="secondaire" onClick={onAnnule}>
            Annuler
          </Bouton>
        )}
      </div>
    </form>
  )
}

export function ActualiteGestionPage() {
  const { id } = useParams({ from: '/espace/actualites/$id' })
  const client = useQueryClient()
  const { data, isPending, isError } = useQuery({
    queryKey: ['actualites-gestion', id],
    queryFn: () => appel<ActualiteGestion>('GET', `/api/actualites/gestion/${id}`),
  })
  const rafraichir = async () => {
    await Promise.all([client.invalidateQueries({ queryKey: ['actualites-gestion'] }), client.invalidateQueries({ queryKey: ['actualites'] })])
  }

  return (
    <Espace titre={data?.titre ?? 'Actualité'} retour={{ to: '/espace/actualites', libelle: 'Actualités' }} roles={[...ROLES]} refus={REFUS} aide="actualites">
      {() => {
        if (isPending) return <p className="text-muted-foreground">Chargement…</p>
        if (isError) return <Alerte>Actualité introuvable.</Alerte>
        return (
          <div className="grid grid-cols-1 gap-6">
            <Bloc titre="Actualité">
              <FormulaireActualite key={data.updated_at} actualite={data} onEnregistre={rafraichir} />
            </Bloc>
            <PhotoActualite actualite={data} rafraichir={rafraichir} />
            {data.statut === 'publiee' && <Partage actualite={data} />}
            <Suppression actualite={data} rafraichir={rafraichir} />
          </div>
        )
      }}
    </Espace>
  )
}

function PhotoActualite({ actualite: a, rafraichir }: { actualite: ActualiteGestion; rafraichir: () => Promise<void> }) {
  const fichier = useRef<HTMLInputElement>(null)
  const [accord, setAccord] = useState(false)
  const [erreur, setErreur] = useState('')
  const [enCours, setEnCours] = useState(false)

  async function deposer(f: File | undefined) {
    if (!f) return
    setErreur('')
    setEnCours(true)
    try {
      const photo = await reduirePhoto(f, PHOTO_ACTUALITE)
      await appel('PUT', `/api/actualites/gestion/${a.id}/image`, { image: photo.image, type: photo.type, accord: true })
      await rafraichir()
      setAccord(false)
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'Envoi impossible.')
    } finally {
      setEnCours(false)
      if (fichier.current) fichier.current.value = ''
    }
  }

  return (
    <Bloc titre="Photo">
      <div className="grid gap-3">
        {a.image ? (
          <img src={imageActualite(a, true)} alt="" className="max-h-80 w-full rounded-xl bg-surface object-cover" />
        ) : (
          <p className="text-sm text-muted-foreground">Pas de photo. Une photo rend l’actualité plus vivante, sur le site comme dans WhatsApp.</p>
        )}
        <Case
          id={`accord-image-${a.id}`}
          libelle="Les enfants reconnaissables sur la photo ont l’accord droit à l’image"
          aide="Vérifiez dans les dossiers (droit à l’image « oui ») ; sinon, choisissez une photo où ils ne sont pas reconnaissables."
          coche={accord}
          onChange={setAccord}
        />
        <input ref={fichier} type="file" accept="image/*" className="sr-only" tabIndex={-1} aria-hidden onChange={(e) => deposer(e.target.files?.[0])} />
        <div className="flex flex-col gap-2 sm:flex-row">
          <Bouton variante="secondaire" enCours={enCours} desactive={!accord} onClick={() => fichier.current?.click()}>
            <Camera className="size-4" aria-hidden /> {a.image ? 'Remplacer la photo' : 'Ajouter une photo'}
          </Bouton>
          {a.image && (
            <Bouton
              variante="danger"
              desactive={enCours}
              onClick={async () => {
                await appel('DELETE', `/api/actualites/gestion/${a.id}/image`)
                await rafraichir()
              }}
            >
              <Trash2 className="size-4" aria-hidden /> Retirer la photo
            </Bouton>
          )}
        </div>
        <Alerte>{erreur}</Alerte>
      </div>
    </Bloc>
  )
}

function Partage({ actualite: a }: { actualite: ActualiteGestion }) {
  const [copie, setCopie] = useState(false)
  const url = urlActualite(a.id)
  return (
    <Bloc titre="Partager">
      <p className="mb-3 text-sm text-muted-foreground">
        {a.visibilite === 'familles' ? 'Actualité réservée aux familles : le lien demande de se connecter.' : 'Postez le lien dans le groupe WhatsApp ou sur Facebook.'}
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <LienBouton href={urlWhatsApp(messageWhatsApp(a, url), null)}>
          <MessageCircle className="size-4" aria-hidden /> Envoyer sur WhatsApp
        </LienBouton>
        <Bouton
          variante="secondaire"
          onClick={async () => {
            await navigator.clipboard.writeText(url)
            setCopie(true)
          }}
        >
          {copie ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
          {copie ? 'Lien copié' : 'Copier le lien'}
        </Bouton>
        <Link to="/actualites/$id" params={{ id: String(a.id) }} className="inline-flex min-h-12 items-center justify-center gap-2 font-semibold text-brand">
          <ExternalLink className="size-4" aria-hidden /> Voir sur le site
        </Link>
      </div>
    </Bloc>
  )
}

function Suppression({ actualite: a, rafraichir }: { actualite: ActualiteGestion; rafraichir: () => Promise<void> }) {
  const navigate = useNavigate()
  const [confirmer, setConfirmer] = useState(false)
  return (
    <div className="grid gap-3">
      {confirmer ? (
        <>
          <p className="text-sm">
            Supprimer <strong>{a.titre}</strong> ? Pour la retirer du site en la gardant, repassez-la plutôt en brouillon.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Bouton
              variante="danger"
              onClick={async () => {
                await appel('DELETE', `/api/actualites/gestion/${a.id}`)
                await rafraichir()
                navigate({ to: '/espace/actualites' })
              }}
            >
              Confirmer la suppression
            </Bouton>
            <Bouton variante="secondaire" onClick={() => setConfirmer(false)}>
              Annuler
            </Bouton>
          </div>
        </>
      ) : (
        <button type="button" onClick={() => setConfirmer(true)} className="inline-flex items-center gap-1.5 justify-self-start text-sm font-semibold text-brand">
          <Trash2 className="size-4" aria-hidden /> Supprimer l’actualité
        </button>
      )}
    </div>
  )
}
