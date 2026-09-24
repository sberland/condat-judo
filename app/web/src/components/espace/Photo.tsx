import { useRef, useState } from 'react'
import { Camera, Trash2 } from 'lucide-react'
import { Alerte, Bouton, Case } from '../formulaire'
import { finValiditePhoto } from '../../content/photos'
import { appel, dateFr, ErreurApi, type EtatPhoto } from '../../lib/api'
import { reduirePhoto } from '../../lib/photo'

// Photo pour la garderie du mercredi (spec 012b) : affichage, dépôt, retrait.

const initiales = (prenom: string, nom: string) => `${prenom.charAt(0)}${nom.charAt(0)}`.toLocaleUpperCase('fr-FR')

/** Photo d'un enfant, ou ses initiales (pas de photo, ou photo indisponible). */
export function PhotoEnfant({ src, prenom, nom, className = 'size-24' }: { src: string | null; prenom: string; nom: string; className?: string }) {
  const [echec, setEchec] = useState(false)
  if (!src || echec) {
    return (
      <span className={`${className} flex shrink-0 items-center justify-center rounded-2xl bg-brand-soft text-2xl font-bold text-brand`} aria-hidden>
        {initiales(prenom, nom)}
      </span>
    )
  }
  return <img src={src} alt={`Photo de ${prenom} ${nom}`} onError={() => setEchec(true)} className={`${className} shrink-0 rounded-2xl bg-surface object-cover`} />
}

/**
 * Photo d'un enfant et ses actions. Famille : un responsable légal donne l'accord en déposant la
 * photo. Bureau : dépôt seulement si l'accord est déjà donné (dossier d'adhésion ou famille).
 */
export function GestionPhoto({
  prenom,
  nom,
  etat,
  url,
  mode,
  rafraichir,
}: {
  prenom: string
  nom: string
  etat: EtatPhoto
  /** GET (image), PUT (dépôt), DELETE (retrait). */
  url: string
  mode: 'famille' | 'bureau'
  rafraichir: () => Promise<unknown>
}) {
  const fichier = useRef<HTMLInputElement>(null)
  const [accord, setAccord] = useState(false)
  const [erreur, setErreur] = useState('')
  const [enCours, setEnCours] = useState(false)
  const accordDonne = etat.accord === 'oui'

  async function deposer(f: File | undefined) {
    if (!f) return
    setErreur('')
    setEnCours(true)
    try {
      const photo = await reduirePhoto(f)
      await appel('PUT', url, { image: photo.image, type: photo.type, ...(mode === 'famille' && !accordDonne ? { accord: true } : {}) })
      await rafraichir()
      setAccord(false)
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'Envoi impossible.')
    } finally {
      setEnCours(false)
      if (fichier.current) fichier.current.value = ''
    }
  }

  async function retirer() {
    setErreur('')
    setEnCours(true)
    try {
      await appel('DELETE', url)
      await rafraichir()
    } catch (err) {
      setErreur(err instanceof ErreurApi ? err.message : 'Retrait impossible.')
    } finally {
      setEnCours(false)
    }
  }

  const peutDeposer = etat.accord !== null && (accordDonne || (mode === 'famille' && accord))

  return (
    <div className="grid gap-3">
      <div className="flex items-start gap-4">
        <PhotoEnfant src={etat.deposeeLe ? `${url}?v=${encodeURIComponent(etat.deposeeLe)}` : null} prenom={prenom} nom={nom} />
        <div className="grid gap-1 text-sm">
          {etat.deposeeLe ? (
            <>
              <p>Déposée le {dateFr(etat.deposeeLe.slice(0, 10))}</p>
              <p className="text-muted-foreground">Montrée aux encadrants le mercredi, jusqu’au {dateFr(finValiditePhoto(etat.deposeeLe))} (à renouveler ensuite).</p>
            </>
          ) : (
            <p className="text-muted-foreground">Pas de photo. Elle aide l’encadrant à reconnaître {prenom} à la garderie.</p>
          )}
        </div>
      </div>

      {etat.accord === null && (
        <p className="text-sm text-muted-foreground">Le dossier d’adhésion de la saison n’est pas encore enregistré : la photo pourra être ajoutée ensuite.</p>
      )}
      {etat.accord !== null && !accordDonne && mode === 'bureau' && (
        <p className="text-sm text-amber-800">
          Accord « photo pour la garderie » {etat.accord === 'non' ? 'refusé' : 'pas encore donné'} : à recueillir dans le dossier d’adhésion, ou par la
          famille depuis son espace.
        </p>
      )}
      {etat.accord !== null && !accordDonne && mode === 'famille' && (
        <Case
          id={`accord-photo-${url}`}
          libelle="J’accepte que cette photo soit montrée aux encadrants"
          aide="Seulement le mercredi même, pour reconnaître mon enfant à la garderie. Je peux la retirer à tout moment."
          coche={accord}
          onChange={setAccord}
        />
      )}

      <input ref={fichier} type="file" accept="image/*" className="sr-only" tabIndex={-1} aria-hidden onChange={(e) => deposer(e.target.files?.[0])} />
      {(peutDeposer || etat.deposeeLe) && (
        <div className="flex flex-col gap-2 sm:flex-row">
          {peutDeposer && (
            <Bouton variante="secondaire" enCours={enCours} onClick={() => fichier.current?.click()}>
              <Camera className="size-4" aria-hidden /> {etat.deposeeLe ? 'Remplacer la photo' : 'Ajouter une photo'}
            </Bouton>
          )}
          {etat.deposeeLe && (
            <Bouton variante="danger" desactive={enCours} onClick={retirer}>
              <Trash2 className="size-4" aria-hidden /> Retirer la photo
            </Bouton>
          )}
        </div>
      )}
      <Alerte>{erreur}</Alerte>
    </div>
  )
}
