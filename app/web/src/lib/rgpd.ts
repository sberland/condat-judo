// Droits RGPD outillés (spec 019) — types des réponses de l'API et textes des accords.
import type { Recueil } from '../content/adhesion'
import type { Valeur } from '../content/rgpd'

/** Ce que couvre chaque accord (affiché à la famille avant qu'elle réponde). */
export const ACCORDS = {
  droit_image: 'Le club peut publier des images de l’enfant sur son site, sa page Facebook ou dans la presse locale.',
  whatsapp: 'Votre numéro est ajouté au groupe du club (informations, compétitions).',
  photo_garderie:
    'Une photo de l’enfant, déposée par vous ou par le bureau, est montrée aux encadrants le mercredi même, pour le reconnaître à la garderie. Répondre non efface la photo.',
} as const

export type AccordsFamille = {
  saison: { id: string; libelle: string }
  accords: {
    adhesion_id: number
    /** « 2027/2028 » : saison courante ou saison des inscriptions (010b). */
    saison: string
    prenom: string
    droit_image: Recueil
    droit_image_le: string | null
    whatsapp: Recueil
    whatsapp_le: string | null
    photo_garderie: Recueil
    photo_garderie_le: string | null
  }[]
}

export type AdherentEchu = { id: number; prenom: string; nom: string; derniere_saison: number }

export type EtatRgpd = {
  conservation: Valeur<number>
  active: boolean
  environnement: 'production' | 'preview' | 'local'
  seuil: number
  echus: AdherentEchu[]
  saisonSuivante: AdherentEchu[]
  purges: { execute_le: string; seuil: number; adherents: number; comptes: number }[]
}

export type EntreeJournal = {
  id: number
  cree_le: string
  action: 'consultation' | 'modification' | 'suppression' | 'export' | 'lien_connexion' | 'deconnexion'
  cible: 'adherent' | 'compte' | 'comptes' | 'famille'
  cible_id: number | null
  detail: string | null
  acteur: string | null
  cible_libelle: string | null
}

export const LIBELLES_ACTION: Record<EntreeJournal['action'], string> = {
  consultation: 'a consulté',
  modification: 'a modifié',
  suppression: 'a supprimé',
  export: 'a exporté les données de',
  lien_connexion: 'a créé un lien de connexion pour',
  deconnexion: 'a déconnecté les appareils de',
}
