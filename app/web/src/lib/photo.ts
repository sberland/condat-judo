// Réduction d'une photo dans le navigateur avant l'envoi (spec 012b) : JPEG, 480 px et 60 Ko au plus
// pour la garderie ; réglages propres aux photos d'actualité (spec 013). La photo d'origine (souvent plusieurs Mo, avec sa localisation) ne quitte
// jamais le téléphone : seule la version réduite, sans métadonnées, est envoyée.
import { COTE_MAX_PHOTO, TAILLE_MAX_PHOTO, type TypePhoto } from '../content/photos'
import { COTE_MAX_IMAGE_ACTUALITE, TAILLE_MAX_IMAGE_ACTUALITE } from '../content/actualites'

export type PhotoReduite = { image: string; type: TypePhoto; apercu: string }

type Reglages = { essais: [cote: number, qualite: number][]; tailleMax: number }

/** Réglages essayés dans l'ordre jusqu'à passer sous le poids maximal. */
export const PHOTO_GARDERIE: Reglages = {
  essais: [
    [COTE_MAX_PHOTO, 0.82],
    [COTE_MAX_PHOTO, 0.65],
    [360, 0.6],
    [280, 0.55],
  ],
  tailleMax: TAILLE_MAX_PHOTO,
}

export const PHOTO_ACTUALITE: Reglages = {
  essais: [
    [COTE_MAX_IMAGE_ACTUALITE, 0.82],
    [COTE_MAX_IMAGE_ACTUALITE, 0.7],
    [1000, 0.65],
    [800, 0.6],
    [640, 0.55],
    [480, 0.5],
  ],
  tailleMax: TAILLE_MAX_IMAGE_ACTUALITE,
}

export async function reduirePhoto(fichier: File, reglages: Reglages = PHOTO_GARDERIE): Promise<PhotoReduite> {
  if (!fichier.type.startsWith('image/')) throw new Error('Choisissez une photo.')
  const url = URL.createObjectURL(fichier)
  try {
    // Une <img> applique l'orientation de l'appareil photo (EXIF), que le canvas reprend.
    const img = new Image()
    img.src = url
    try {
      await img.decode()
    } catch {
      throw new Error('Cette photo ne peut pas être lue : essayez-en une autre.')
    }
    for (const [cote, qualite] of reglages.essais) {
      const echelle = Math.min(1, cote / Math.max(img.naturalWidth, img.naturalHeight))
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(img.naturalWidth * echelle))
      canvas.height = Math.max(1, Math.round(img.naturalHeight * echelle))
      canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height)
      const blob = await new Promise<Blob | null>((ok) => canvas.toBlob(ok, 'image/jpeg', qualite))
      if (blob && blob.size <= reglages.tailleMax) {
        const apercu = await lireDataUrl(blob)
        return { image: apercu.slice(apercu.indexOf(',') + 1), type: 'image/jpeg', apercu }
      }
    }
    throw new Error('Photo trop lourde, même réduite : essayez-en une autre.')
  } finally {
    URL.revokeObjectURL(url)
  }
}

function lireDataUrl(blob: Blob): Promise<string> {
  return new Promise((ok, ko) => {
    const lecteur = new FileReader()
    lecteur.onload = () => ok(String(lecteur.result))
    lecteur.onerror = () => ko(new Error('Lecture de la photo impossible.'))
    lecteur.readAsDataURL(blob)
  })
}
