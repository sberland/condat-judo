// Cotisations (spec 011) — règles partagées par l'écran et le Worker : modes de paiement,
// échéancier, restant dû, répartition d'un paiement sur plusieurs dossiers. ⚠️ Importé par le
// Worker : pas de DOM, pas de React ; montants en centimes.
import { SAISON } from './adhesion'

/** Ce que la famille remet au club (plus détaillé que le « mode prévu » du dossier). */
export const MODES_ENCAISSEMENT = {
  cheque: 'Chèque',
  especes: 'Espèces',
  cb: 'Carte bancaire',
  virement: 'Virement',
  cheques_vacances: 'Chèques vacances',
  pass_sport: 'Pass’Sport',
  autre: 'Autre',
} as const
export type ModeEncaissement = keyof typeof MODES_ENCAISSEMENT

/** Modes encaissés dès leur réception : rien à remettre en banque. */
export const ENCAISSES_A_RECEPTION: readonly ModeEncaissement[] = ['cb', 'virement']

/**
 * Paiement en 3 fois : le 1er versement est dû à l'inscription, les 2e et 3e à ces dates (chèques
 * remis à l'inscription, encaissés plus tard). ⚠️ Dates à confirmer par la trésorière
 * (questionnaire du club) ; en base avec les saisons (spec 003).
 */
export const ECHEANCES_3_FOIS: { saison: string; dates: [string, string]; provisoire: boolean } = {
  saison: SAISON.id,
  dates: ['2027-01-05', '2027-04-05'],
  provisoire: true,
}

export type DossierPaiement = {
  montant_total: number
  paiement_3_fois: number | boolean
  echeance_1: number
  echeance_2: number
  echeance_3: number
}

export type Versement = { montant: number; date: string | null }

/** Versements attendus ; `date` null = dû dès l'inscription. */
export function echeancier(d: DossierPaiement): Versement[] {
  if (!d.paiement_3_fois) return [{ montant: d.montant_total, date: null }]
  const [date2, date3] = ECHEANCES_3_FOIS.dates
  return [
    { montant: d.echeance_1, date: null },
    { montant: d.echeance_2, date: date2 },
    { montant: d.echeance_3, date: date3 },
  ]
}

/** Montant échu à la date donnée (AAAA-MM-JJ). */
export const exigible = (d: DossierPaiement, aujourdhui: string): number =>
  echeancier(d)
    .filter((v) => v.date === null || v.date <= aujourdhui)
    .reduce((s, v) => s + v.montant, 0)

export type StatutPaiement = 'a_payer' | 'partiel' | 'solde'

export const LIBELLES_STATUT_PAIEMENT: Record<StatutPaiement, string> = {
  a_payer: 'À payer',
  partiel: 'Partiellement payé',
  solde: 'Soldé',
}

export type Situation = {
  du: number
  paye: number
  /** Reste à payer (0 si soldé). */
  restant: number
  /** Payé en trop (0 sinon). */
  tropPercu: number
  /** Versements échus non couverts. */
  retard: number
  statut: StatutPaiement
}

/** Situation d'un dossier, ou d'une famille (sommes des dossiers). */
export function situation(du: number, paye: number, exigibleMontant: number): Situation {
  return {
    du,
    paye,
    restant: Math.max(du - paye, 0),
    tropPercu: Math.max(paye - du, 0),
    retard: Math.max(exigibleMontant - paye, 0),
    statut: paye <= 0 ? 'a_payer' : paye >= du ? 'solde' : 'partiel',
  }
}

/**
 * Situation d'une famille ou de la saison : somme des situations de ses dossiers. L'avance payée
 * pour un enfant ne couvre pas le retard d'un autre (les paiements sont répartis par dossier).
 */
export function cumul(situations: Situation[]): Situation {
  const somme = (k: 'du' | 'paye' | 'restant' | 'tropPercu' | 'retard') => situations.reduce((s, x) => s + x[k], 0)
  const du = somme('du')
  const paye = somme('paye')
  return {
    du,
    paye,
    restant: somme('restant'),
    tropPercu: somme('tropPercu'),
    retard: somme('retard'),
    statut: paye <= 0 ? 'a_payer' : somme('restant') === 0 ? 'solde' : 'partiel',
  }
}

/**
 * Répartit un montant sur des dossiers, au prorata de leur restant dû, au centime près (la somme
 * des parts vaut toujours le montant). Au-delà du total dû, l'excédent va au premier dossier ;
 * si rien n'est dû, parts égales. Les parts nulles sont à écarter par l'appelant.
 */
export function repartir(montant: number, restants: number[]): number[] {
  const n = restants.length
  if (n === 0) return []
  const dus = restants.map((r) => Math.max(r, 0))
  const total = dus.reduce((s, r) => s + r, 0)
  let parts: number[]
  if (total === 0) {
    parts = dus.map(() => Math.floor(montant / n))
  } else if (montant >= total) {
    parts = [...dus]
  } else {
    parts = dus.map((r) => Math.floor((montant * r) / total))
  }
  // Reliquat (arrondis, excédent) : un centime à la fois aux dossiers qui doivent encore le plus,
  // puis tout le reste au premier.
  let reste = montant - parts.reduce((s, p) => s + p, 0)
  if (montant < total) {
    const ordre = dus.map((r, i) => ({ i, manque: r - (parts[i] ?? 0) })).sort((a, b) => b.manque - a.manque)
    for (const { i } of ordre) {
      if (reste <= 0) break
      parts[i] = (parts[i] ?? 0) + 1
      reste--
    }
  }
  parts[0] = (parts[0] ?? 0) + reste
  return parts
}
