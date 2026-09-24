// Réduction d'une photo dans le navigateur avant l'envoi (spec 012b) : JPEG, 480 px au plus,
// 60 Ko au plus. La photo d'origine (souvent plusieurs Mo, avec sa localisation) ne quitte
// jamais le téléphone : seule la version réduite, sans métadonnées, est envoyée.
import { COTE_MAX_PHOTO, TAILLE_MAX_PHOTO, type TypePhoto } from '../content/photos'

export type PhotoReduite = { image: string; type: TypePhoto; apercu: string }

/** Réglages essayés dans l'ordre jusqu'à passer sous le poids maximal. */
const ESSAIS: [cote: number, qualite: number][] = [
  [COTE_MAX_PHOTO, 0.82],
  [COTE_MAX_PHOTO, 0.65],
  [360, 0.6],
  [280, 0.55],
]

export async function reduirePhoto(fichier: File): Promise<PhotoReduite> {
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
    for (const [cote, qualite] of ESSAIS) {
      const echelle = Math.min(1, cote / Math.max(img.naturalWidth, img.naturalHeight))
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(img.naturalWidth * echelle))
      canvas.height = Math.max(1, Math.round(img.naturalHeight * echelle))
      canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height)
      const blob = await new Promise<Blob | null>((ok) => canvas.toBlob(ok, 'image/jpeg', qualite))
      if (blob && blob.size <= TAILLE_MAX_PHOTO) {
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
