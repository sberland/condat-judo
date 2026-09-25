// Dossier d'adhésion rempli en ligne par la famille (spec 010b) : types de l'API et brouillon gardé
// sur le téléphone jusqu'à l'envoi.
import type { EtatDossier, Formalite, ModePaiement, Recueil, SanteFamille } from '../content/adhesion'
import type { Echeances } from '../content/paiements'
import type { Tarifs } from '../content/tarifs'

export type DossierFamille = {
  formule: string
  passeport: 0 | 1
  hors_commune: 0 | 1
  reduction_famille: 0 | 1
  montant_participation: number
  montant_licence: number
  montant_supplements: number
  montant_reduction: number
  montant_total: number
  paiement_mode: ModePaiement | null
  paiement_3_fois: 0 | 1
  echeance_1: number
  echeance_2: number
  echeance_3: number
  formalite_type: Formalite | null
  formalite_recue_le: string | null
  soins_urgence: Recueil
  droit_image: Recueil
  whatsapp: Recueil
  photo_garderie: Recueil
  envoye_le: string | null
  valide_le: string | null
}

export type FicheInscription = {
  id: number
  prenom: string
  nom: string
  date_naissance: string
  sexe: 'F' | 'M'
  grade: string | null
  numero_licence: string | null
  adresse: string | null
  code_postal: string | null
  ville: string | null
}

export type AdherentInscription = {
  adherent: FicheInscription
  /** L'adhérent majeur lui-même. */
  moi: boolean
  mineur: boolean
  /** Fiche ajoutée par une famille, pas encore vérifiée par le bureau. */
  aVerifier: boolean
  /** Fiche ajoutée par moi et pas encore vérifiée : je peux la corriger. */
  ficheModifiable: boolean
  responsables: { prenom: string; nom: string; qualite: string }[]
  dossier: DossierFamille | null
  etat: EtatDossier | null
  /** Pas de dossier, ou envoyé par la famille et pas encore validé. */
  modifiable: boolean
  precedent: {
    saison: string
    formule: string
    passeport: boolean
    paiement_mode: ModePaiement | null
    paiement_3_fois: boolean
    soins_urgence: Recueil
    droit_image: Recueil
    whatsapp: Recueil
    photo_garderie: Recueil
  } | null
  proposition: { formule: string; reductionFamille: boolean }
}

export type Inscriptions = {
  saison: { id: string; libelle: string; tarifs: Tarifs; echeances3Fois: Echeances } | null
  adherents: AdherentInscription[]
}

/** Saisie de la famille, étape par étape ; consentements : '' tant qu'elle n'a pas répondu. */
export type SaisieFamille = {
  adresse: string
  code_postal: string
  ville: string
  formule: string
  passeport: boolean
  paiement_mode: ModePaiement | ''
  paiement_3_fois: boolean
  sante: SanteFamille | ''
  soins_urgence: 'oui' | 'non' | ''
  droit_image: 'oui' | 'non' | ''
  whatsapp: 'oui' | 'non' | ''
  photo_garderie: 'oui' | 'non' | ''
  reglement: boolean
  assurance: boolean
  donnees: boolean
}

const reponse = (v: Recueil | undefined): 'oui' | 'non' | '' => (v === 'oui' || v === 'non' ? v : '')

/**
 * Saisie de départ : le dossier déjà envoyé (on le modifie), sinon la reprise de l'an dernier —
 * formule, passeport, paiement, adresse. Les consentements de l'an dernier ne sont JAMAIS repris
 * (un consentement est un acte positif) : seulement rappelés à l'écran.
 */
export function saisieInitiale(a: AdherentInscription): SaisieFamille {
  const d = a.dossier
  const p = a.precedent
  return {
    adresse: a.adherent.adresse ?? '',
    code_postal: a.adherent.code_postal ?? '',
    ville: a.adherent.ville ?? '',
    formule: d?.formule ?? a.proposition.formule,
    passeport: d ? d.passeport === 1 : (p?.passeport ?? false),
    paiement_mode: d?.paiement_mode ?? p?.paiement_mode ?? '',
    paiement_3_fois: d ? d.paiement_3_fois === 1 : (p?.paiement_3_fois ?? false),
    sante: d ? (d.formalite_type === 'certificat' ? 'certificat' : 'attestation') : '',
    soins_urgence: reponse(d?.soins_urgence),
    droit_image: reponse(d?.droit_image),
    whatsapp: reponse(d?.whatsapp),
    photo_garderie: reponse(d?.photo_garderie),
    // Engagements : à accepter à chaque envoi.
    reglement: false,
    assurance: false,
    donnees: false,
  }
}

// Brouillon sur ce téléphone (commodité) : repris si la famille revient avant d'avoir envoyé.
const cleBrouillon = (saison: string, adherentId: number) => `condat-judo-dossier-${saison}-${adherentId}`

export function lireBrouillon(saison: string, adherentId: number): SaisieFamille | null {
  try {
    const v = localStorage.getItem(cleBrouillon(saison, adherentId))
    return v ? (JSON.parse(v) as SaisieFamille) : null
  } catch {
    return null
  }
}

export function ecrireBrouillon(saison: string, adherentId: number, s: SaisieFamille | null) {
  try {
    if (s) localStorage.setItem(cleBrouillon(saison, adherentId), JSON.stringify(s))
    else localStorage.removeItem(cleBrouillon(saison, adherentId))
  } catch {
    // Stockage indisponible : pas de brouillon, sans gravité.
  }
}

/** Statut affiché à la famille. */
export function statutFamille(a: AdherentInscription): { libelle: string; ton: 'a_faire' | 'attente' | 'ok' } {
  const d = a.dossier
  if (!d) return { libelle: 'À remplir', ton: 'a_faire' }
  if (d.valide_le) return { libelle: 'Validé par le club', ton: 'ok' }
  if (d.envoye_le) return { libelle: 'Envoyé, en attente du bureau', ton: 'attente' }
  return { libelle: 'Enregistré par le club', ton: 'ok' }
}
