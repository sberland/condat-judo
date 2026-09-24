// Garderie du mercredi (spec 012a) — réglages de la saison (référentiel, spec 003) et règles
// partagées par l'écran et le Worker : mercredis ouverts, délai de demande. ⚠️ Importé par le
// Worker : pas de DOM. Dates « AAAA-MM-JJ », heures de Paris « AAAA-MM-JJ HH:MM ».
import { heure } from './heures'

export type ReglagesGarderie = {
  /** Lieux de récupération (école, garderie) ; un seul = rien à choisir pour le parent. */
  lieux: string[]
  /** Premier et dernier mercredi de la période. */
  debut: string
  fin: string
  /** Mercredis sans garderie (vacances, jours fériés). */
  fermes: string[]
  /** Demande possible jusqu'à `jours` jours avant le mercredi, à `heure` (heure de Paris). */
  limite: { jours: number; heure: string }
  /** Réglages à confirmer : les parents ne peuvent pas encore demander en production. */
  provisoire: boolean
}

const JOUR_MS = 86_400_000
const versDate = (iso: string) => new Date(`${iso}T12:00:00Z`)

export const ajouterJours = (iso: string, n: number) => new Date(versDate(iso).getTime() + n * JOUR_MS).toISOString().slice(0, 10)

export const estMercredi = (iso: string) => /^\d{4}-\d{2}-\d{2}$/.test(iso) && versDate(iso).getUTCDay() === 3

/** Premier mercredi à partir de cette date (incluse). */
export function mercrediSuivant(iso: string): string {
  let d = iso
  while (!estMercredi(d)) d = ajouterJours(d, 1)
  return d
}

/** Dernier mercredi jusqu'à cette date (incluse). */
export function mercrediPrecedent(iso: string): string {
  let d = iso
  while (!estMercredi(d)) d = ajouterJours(d, -1)
  return d
}

/** Tous les mercredis de la période. */
export function tousLesMercredis(debut: string, fin: string): string[] {
  const liste: string[] = []
  for (let d = mercrediSuivant(debut); d <= fin; d = ajouterJours(d, 7)) liste.push(d)
  return liste
}

export const mercredisOuverts = (g: ReglagesGarderie) => tousLesMercredis(g.debut, g.fin).filter((m) => !g.fermes.includes(m))

/** Fin des demandes pour ce mercredi (« AAAA-MM-JJ HH:MM », heure de Paris). */
export const limiteDemande = (g: ReglagesGarderie, mercredi: string) => `${ajouterJours(mercredi, -g.limite.jours)} ${g.limite.heure}`

/** Maintenant, heure de Paris (« AAAA-MM-JJ HH:MM »). */
export const maintenantParis = (d = new Date()) => d.toLocaleString('sv-SE', { timeZone: 'Europe/Paris' }).slice(0, 16)

/** Le parent peut encore demander ou annuler ce mercredi. */
export const modifiable = (g: ReglagesGarderie, mercredi: string, maintenant: string) => maintenant < limiteDemande(g, mercredi)

/** « la veille à 20 h », « le jour même à 12 h », « 2 jours avant, à 18 h ». */
export function libelleLimite(g: ReglagesGarderie): string {
  const h = heure(g.limite.heure)
  if (g.limite.jours === 0) return `le jour même à ${h}`
  if (g.limite.jours === 1) return `la veille à ${h}`
  return `${g.limite.jours} jours avant, à ${h}`
}
