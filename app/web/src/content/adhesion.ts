// Dossier d'adhésion (spec 010a) — règles partagées par l'écran (calcul en direct) et le Worker
// (calcul de référence : c'est lui qui fige les montants). ⚠️ Importé par le Worker : pas de DOM,
// pas de React ; compatible `noUncheckedIndexedAccess`.
import { MONTANTS, TARIFS, type Formule } from './tarifs'

/** Saison des dossiers ressaisis (grille 2026/2027 en dur ; saisons en base avec la spec 003). */
export const SAISON = { id: '2026-2027', libelle: '2026/2027' } as const

/** Ceintures, dans l'ordre de progression (France Judo) ; aucune = taïso, yoga ou débutant. */
export const CEINTURES = [
  'Blanche',
  'Blanche-jaune',
  'Jaune',
  'Jaune-orange',
  'Orange',
  'Orange-verte',
  'Verte',
  'Verte-bleue',
  'Bleue',
  'Bleue-marron',
  'Marron',
  'Noire 1er dan',
  'Noire 2e dan',
  'Noire 3e dan',
  'Noire 4e dan',
  'Noire 5e dan',
] as const

export const FORMULES: Formule[] = TARIFS.groupes.flatMap((g) => g.formules)
export const formuleParId = (id: string): Formule | undefined => FORMULES.find((f) => f.id === id)
const estJudo = (id: string) => id.startsWith('judo-')

/** Tranche judo du formulaire 2026/2027 d'après l'année de naissance. */
export function formuleJudoSuggeree(anneeNaissance: number): string {
  if (anneeNaissance >= 2019) return 'judo-micro-mini'
  if (anneeNaissance >= 2007) return 'judo-poussins-juniors'
  return 'judo-adulte'
}

/** Résident hors commune : suggestion d'après l'adresse (Condat-sur-Vienne = 87920). */
export const horsCommuneSuggere = (codePostal: string | null) => !!codePostal && codePostal !== '87920'

export type OptionsMontant = { formule: string; passeport: boolean; horsCommune: boolean; reductionFamille: boolean }

export type Montant = {
  participation: number
  licence: number
  supplements: number
  reduction: number
  total: number
  /** Paiement en 3 fois : suppléments et réduction portent sur le 1er versement. */
  echeancier: [number, number, number]
}

/** Montant d'un dossier (centimes) ; null si la formule est inconnue. Passeport : judo seulement. */
export function calculerMontant(o: OptionsMontant): Montant | null {
  const f = formuleParId(o.formule)
  if (!f) return null
  const supplements = (o.passeport && estJudo(f.id) ? MONTANTS.passeport : 0) + (o.horsCommune ? MONTANTS.horsCommune : 0)
  const reduction = o.reductionFamille ? MONTANTS.reductionFamille : 0
  const [premier, deuxieme, troisieme] = f.echeancier
  return {
    participation: f.participation,
    licence: f.licence,
    supplements,
    reduction,
    total: f.participation + f.licence + supplements - reduction,
    echeancier: [premier + supplements - reduction, deuxieme, troisieme],
  }
}

export const passeportPossible = (formule: string) => estJudo(formule)

export const MODES_PAIEMENT = { cheque: 'Chèque', especes: 'Espèces', cb: 'Carte bancaire', autre: 'Chèques vacances et autres' } as const
export type ModePaiement = keyof typeof MODES_PAIEMENT

// Formalités médicales : on n'enregistre QUE le type de pièce et sa date de réception (aucune donnée de santé).
export const FORMALITES = {
  attestation_qs_mineur: 'Attestation du questionnaire de santé (mineur)',
  certificat: 'Certificat médical (1ʳᵉ licence d’un majeur)',
  attestation_qs_sport: 'Attestation QS-SPORT (majeur, renouvellement)',
} as const
export type Formalite = keyof typeof FORMALITES

/** Consentement ou autorisation : « non recueilli » tant que la personne ne s'est pas prononcée. */
export const RECUEILS = { non_recueilli: 'Non recueilli', oui: 'Oui', non: 'Non' } as const
export type Recueil = keyof typeof RECUEILS

export type DossierPourEtat = {
  paiement_mode: string | null
  formalite_recue_le: string | null
  soins_urgence: Recueil
  droit_image: Recueil
  whatsapp: Recueil
  valide_le: string | null
}

export type EtatDossier = { statut: 'a_completer' | 'complet' | 'valide'; manques: string[]; aRecueillir: string[] }

export const LIBELLES_STATUT: Record<EtatDossier['statut'], string> = { a_completer: 'À compléter', complet: 'Complet', valide: 'Validé' }

/**
 * Manques = bloquent le dossier ; « à recueillir » = consentements et autorisations non encore
 * exprimés (le formulaire papier ne les demandait pas) : signalés, sans bloquer.
 */
export function etatDossier(d: DossierPourEtat, contexte: { mineur: boolean; responsables: number }): EtatDossier {
  const manques: string[] = []
  if (contexte.mineur && contexte.responsables === 0) manques.push('responsable légal')
  if (!d.paiement_mode) manques.push('mode de paiement')
  if (!d.formalite_recue_le) manques.push('formalité médicale')
  const aRecueillir: string[] = []
  if (contexte.mineur && d.soins_urgence === 'non_recueilli') aRecueillir.push('soins d’urgence')
  if (d.droit_image === 'non_recueilli') aRecueillir.push('droit à l’image')
  if (d.whatsapp === 'non_recueilli') aRecueillir.push('groupe WhatsApp')
  const statut = manques.length ? 'a_completer' : d.valide_le ? 'valide' : 'complet'
  return { statut, manques, aRecueillir }
}

/** Mineur à la date donnée (date de naissance ISO). */
export function estMineur(dateNaissance: string, aujourdhui = new Date()): boolean {
  const majorite = new Date(`${Number(dateNaissance.slice(0, 4)) + 18}${dateNaissance.slice(4)}T00:00:00`)
  return aujourdhui < majorite
}
