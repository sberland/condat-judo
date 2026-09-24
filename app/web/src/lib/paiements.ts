// Cotisations (spec 011) — types des réponses de l'API, saisie des montants, exports.
import type { ModeEncaissement, Situation } from '../content/paiements'
import { MODES_ENCAISSEMENT } from '../content/paiements'
import { dateFr } from './api'

type Saison = { id: string; libelle: string }
type Echeances = { dates: [string, string]; provisoire: boolean }

export type Membre = { adhesion_id: number; prenom: string; nom: string }

export type DossierTresorerie = Situation & {
  adhesion_id: number
  adherent_id: number
  prenom: string
  nom: string
  formule: string
  montant_total: number
  paiement_3_fois: number
  echeance_1: number
  echeance_2: number
  echeance_3: number
  paiement_mode: string | null
}

export type FamilleResume = Situation & { id: number; libelle: string; membres: Membre[] }

export type Paiement = {
  id: number
  montant: number
  mode: ModeEncaissement
  reference: string | null
  recu_le: string
  encaisser_le: string | null
  encaisse_le: string | null
  parts: (Membre & { montant: number })[]
}

export type TableauTresorerie = { saison: Saison; echeances: Echeances; totaux: Situation; aRemettre: Paiement[]; familles: FamilleResume[] }

export type FicheFamille = {
  saison: Saison
  echeances: Echeances
  famille: FamilleResume & {
    responsables: { id: number; prenom: string; nom: string; telephone: string | null }[]
    dossiers: DossierTresorerie[]
  }
  paiements: Paiement[]
}

/** Espace famille : ses dossiers de la saison et leurs versements (sans référence de chèque). */
export type MesCotisations = {
  saison: Saison
  echeances: Echeances
  dossiers: (Situation & {
    adhesion_id: number
    prenom: string
    nom: string
    formule: string
    montant_total: number
    paiement_3_fois: number
    echeance_1: number
    echeance_2: number
    echeance_3: number
    versements: { montant: number; mode: ModeEncaissement; recu_le: string; encaisser_le: string | null; encaisse_le: string | null }[]
  })[]
}

// --- Saisie des montants ---

/** « 147 », « 147,5 », « 147.50 € », « 1 234,56 » → centimes ; null si illisible ou nul. */
export function lireEuros(saisie: string): number | null {
  const v = saisie.replace(/[\s€]/g, '').replace(',', '.')
  if (!/^\d+(\.\d{1,2})?$/.test(v)) return null
  const c = Math.round(Number(v) * 100)
  return c > 0 ? c : null
}

/** 13000 → « 130 » ; 12345 → « 123,45 » (valeur d'un champ de saisie). */
export const saisieEuros = (centimes: number) =>
  centimes % 100 === 0 ? String(centimes / 100) : (centimes / 100).toFixed(2).replace('.', ',')

// --- Exports pour la comptabilité ---

const euroCsv = (centimes: number) => (centimes / 100).toFixed(2).replace('.', ',')

export function tableauPaiements(paiements: Paiement[]): string[][] {
  return [
    ['Reçu le', 'Enfants', 'Mode', 'Référence', 'Montant (€)', 'À encaisser le', 'Remis en banque le'],
    ...paiements.map((p) => [
      dateFr(p.recu_le),
      p.parts.map((x) => `${x.prenom} ${x.nom} (${euroCsv(x.montant)})`).join(', '),
      MODES_ENCAISSEMENT[p.mode] ?? p.mode,
      p.reference ?? '',
      euroCsv(p.montant),
      p.encaisser_le ? dateFr(p.encaisser_le) : '',
      p.encaisse_le ? dateFr(p.encaisse_le) : '',
    ]),
  ]
}

export function tableauFamilles(familles: FamilleResume[]): string[][] {
  return [
    ['Famille', 'Adhérents', 'Dû (€)', 'Payé (€)', 'Reste (€)', 'En retard (€)'],
    ...familles.map((f) => [
      f.libelle,
      f.membres.map((m) => m.prenom).join(', '),
      euroCsv(f.du),
      euroCsv(f.paye),
      euroCsv(f.restant),
      euroCsv(f.retard),
    ]),
  ]
}
