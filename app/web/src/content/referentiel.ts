// Référentiel d'une saison (spec 003) : catégories d'âge, grille tarifaire, dates du paiement en
// 3 fois, horaires des cours, garderie du mercredi (012a). Un document par saison, en base (table
// `saisons`), validé ici à chaque enregistrement ; le bureau prépare la saison suivante par
// copie. ⚠️ Importé par le Worker : pas de DOM ; compatible `noUncheckedIndexedAccess`.
import type { Categorie } from './categories'
import { estMercredi, mercrediPrecedent, mercrediSuivant, type ReglagesGarderie } from './garderie'
import type { Echeances } from './paiements'
import type { Ajustement, Formule, GroupeTarifs, Tarifs } from './tarifs'

export const JOURS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'] as const
export type Jour = (typeof JOURS)[number]

/** Créneau d'un cours ; heures « HH:MM ». */
export type Cours = { jour: Jour; debut: string; fin: string; cours: string; public: string }

export type Referentiel = {
  categories: Categorie[]
  tarifs: Tarifs
  echeances3Fois: Echeances
  /** Horaires à confirmer : masqués en production (page publique). */
  horaires: { cours: Cours[]; provisoire: boolean }
  /** Garderie du mercredi (spec 012a). */
  garderie: ReglagesGarderie
}

export type Saison = {
  id: string // « 2026-2027 »
  libelle: string // « 2026/2027 »
  debut: string
  fin: string
  courante: boolean
  inscriptions_ouvertes: boolean
  referentiel: Referentiel
}

// --- Saisons (septembre → août) ---

/** Saison d'une date : « 2026-2027 » du 1er septembre 2026 au 31 août 2027. */
export function saisonDe(date: string): string {
  const [annee = 0, mois = 0] = date.split('-').map(Number)
  const debut = mois >= 9 ? annee : annee - 1
  return `${debut}-${debut + 1}`
}

export const libelleSaison = (id: string) => id.replace('-', '/')

/** Identifiant, libellé et dates de la saison qui suit. */
export function saisonSuivante(id: string): { id: string; libelle: string; debut: string; fin: string } {
  const debut = Number(id.slice(0, 4)) + 1
  const suivante = `${debut}-${debut + 1}`
  return { id: suivante, libelle: libelleSaison(suivante), debut: `${debut}-09-01`, fin: `${debut + 1}-08-31` }
}

const plusUnAn = (date: string) => `${Number(date.slice(0, 4)) + 1}${date.slice(4)}`
const decaler = <T extends { de: number; a: number }>(p: T): T => ({ ...p, de: p.de === 1900 ? 1900 : p.de + 1, a: p.a + 1 })

/** Point de départ de la saison suivante : années de naissance et dates décalées d'un an. */
export function copierReferentiel(r: Referentiel): Referentiel {
  // Copie profonde : rien n'est partagé avec la saison d'origine.
  const copie = structuredClone(r)
  copie.categories = copie.categories.map(decaler)
  for (const g of copie.tarifs.groupes) for (const f of g.formules) f.annees = f.annees ? decaler(f.annees) : null
  copie.echeances3Fois.dates = [plusUnAn(r.echeances3Fois.dates[0]), plusUnAn(r.echeances3Fois.dates[1])]
  // Garderie : même période un an plus tard (sur des mercredis) ; mercredis fermés à revoir.
  copie.garderie.debut = mercrediSuivant(plusUnAn(r.garderie.debut))
  copie.garderie.fin = mercrediPrecedent(plusUnAn(r.garderie.fin))
  copie.garderie.fermes = []
  copie.garderie.provisoire = true
  return copie
}

// --- Validation (toute saisie du bureau passe par ici, côté Worker) ---

export type ResultatReferentiel = { ok: true; valeur: Referentiel } | { ok: false; erreurs: Record<string, string> }

type Brut = Record<string, unknown>
const objet = (v: unknown): Brut => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Brut) : {})
const tableau = (v: unknown): unknown[] => (Array.isArray(v) ? v : [])
const texte = (v: unknown) => (typeof v === 'string' ? v.trim() : '')
const entier = (v: unknown) => (typeof v === 'number' && Number.isInteger(v) ? v : NaN)
const DATE = /^\d{4}-\d{2}-\d{2}$/
const HEURE = /^([01]\d|2[0-3]):[0-5]\d$/
const ID = /^[a-z0-9-]{1,40}$/

export function validerReferentiel(entree: unknown): ResultatReferentiel {
  const erreurs: Record<string, string> = {}
  const e = (chemin: string, message: string) => {
    erreurs[chemin] ??= message
  }
  const r = objet(entree)

  const annees = (chemin: string, v: unknown): { de: number; a: number } => {
    const o = objet(v)
    const de = entier(o.de)
    const a = entier(o.a)
    if (!(de >= 1900 && de <= 2100) || !(a >= 1900 && a <= 2100)) e(chemin, 'Années de naissance invalides')
    else if (de > a) e(chemin, 'Année « de » après l’année « à »')
    return { de, a }
  }
  const montant = (chemin: string, v: unknown, max = 1_000_000): number => {
    const m = entier(v)
    if (!(m >= 0 && m <= max)) e(chemin, 'Montant invalide')
    return m
  }
  const libelle = (chemin: string, v: unknown, nom: string, max: number, requis = true): string => {
    const t = texte(v)
    if (requis && !t) e(chemin, `${nom} obligatoire`)
    else if (t.length > max) e(chemin, `${nom} : ${max} caractères maximum`)
    return t
  }

  // Catégories d'âge : identifiants stables (compétitions), années sans chevauchement.
  const categories: Categorie[] = tableau(r.categories).map((v, i) => {
    const o = objet(v)
    const id = texte(o.id)
    if (!ID.test(id)) e(`categories.${i}`, 'Identifiant de catégorie invalide')
    return { id, nom: libelle(`categories.${i}`, o.nom, 'Nom de catégorie', 40), ...annees(`categories.${i}`, o) }
  })
  if (!categories.length) e('categories', 'Au moins une catégorie')
  if (new Set(categories.map((c) => c.id)).size !== categories.length) e('categories', 'Deux catégories ont le même identifiant')
  const triees = [...categories].sort((x, y) => x.de - y.de)
  triees.forEach((c, i) => {
    const suivante = triees[i + 1]
    if (suivante && c.a >= suivante.de) e('categories', `${c.nom} et ${suivante.nom} se chevauchent`)
  })

  // Grille tarifaire.
  const t = objet(r.tarifs)
  const ajustement = (chemin: string, v: unknown): Ajustement => {
    const o = objet(v)
    return { montant: montant(chemin, o.montant, 100_000), precision: libelle(chemin, o.precision, 'Précision', 200, false) }
  }
  const groupes: GroupeTarifs[] = tableau(t.groupes).map((g, i) => {
    const og = objet(g)
    const formules: Formule[] = tableau(og.formules).map((f, j) => {
      const of = objet(f)
      const chemin = `tarifs.groupes.${i}.formules.${j}`
      const id = texte(of.id)
      if (!ID.test(id)) e(chemin, 'Identifiant de formule invalide')
      const participation = montant(chemin, of.participation)
      const licence = montant(chemin, of.licence)
      const ech = tableau(of.echeancier).map((m) => montant(chemin, m))
      if (ech.length !== 3) e(chemin, 'Échéancier : trois versements')
      else if (ech[0]! + ech[1]! + ech[2]! !== participation + licence) e(chemin, 'Les trois versements doivent totaliser participation + licence')
      return {
        id,
        nom: libelle(chemin, of.nom, 'Nom de formule', 80),
        public: libelle(chemin, of.public, 'Public', 80, false),
        participation,
        licence,
        echeancier: [ech[0] ?? 0, ech[1] ?? 0, ech[2] ?? 0],
        judo: of.judo === true,
        annees: of.annees === null || of.annees === undefined ? null : annees(chemin, of.annees),
      }
    })
    if (!formules.length) e(`tarifs.groupes.${i}`, 'Au moins une formule par groupe')
    return { titre: libelle(`tarifs.groupes.${i}`, og.titre, 'Titre du groupe', 60), formules }
  })
  if (!groupes.length) e('tarifs', 'Au moins un groupe de formules')
  const ids = groupes.flatMap((g) => g.formules.map((f) => f.id))
  if (new Set(ids).size !== ids.length) e('tarifs', 'Deux formules ont le même identifiant')
  const modes = tableau(t.modesPaiement).map((m) => texte(m)).filter(Boolean)
  if (modes.length > 10 || modes.some((m) => m.length > 60)) e('tarifs.modesPaiement', 'Modes de paiement : 10 au plus, 60 caractères chacun')
  const tarifs: Tarifs = {
    provisoire: t.provisoire === true,
    groupes,
    passeport: ajustement('tarifs.passeport', t.passeport),
    horsCommune: ajustement('tarifs.horsCommune', t.horsCommune),
    reductionFamille: ajustement('tarifs.reductionFamille', t.reductionFamille),
    modesPaiement: modes,
  }

  // Paiement en 3 fois.
  const ec = objet(r.echeances3Fois)
  const dates = tableau(ec.dates).map((d) => texte(d))
  if (dates.length !== 2 || !dates.every((d) => DATE.test(d))) e('echeances3Fois', 'Deux dates (AAAA-MM-JJ)')
  else if (dates[0]! > dates[1]!) e('echeances3Fois', 'La 2e échéance doit précéder la 3e')
  const echeances3Fois: Echeances = { dates: [dates[0] ?? '', dates[1] ?? ''], provisoire: ec.provisoire === true }

  // Horaires.
  const h = objet(r.horaires)
  const cours: Cours[] = tableau(h.cours).map((v, i) => {
    const o = objet(v)
    const jour = texte(o.jour) as Jour
    if (!JOURS.includes(jour)) e(`horaires.cours.${i}`, 'Jour invalide')
    const debut = texte(o.debut)
    const fin = texte(o.fin)
    if (!HEURE.test(debut) || !HEURE.test(fin)) e(`horaires.cours.${i}`, 'Heures invalides (HH:MM)')
    else if (debut >= fin) e(`horaires.cours.${i}`, 'Le cours doit finir après son début')
    return { jour, debut, fin, cours: libelle(`horaires.cours.${i}`, o.cours, 'Cours', 60), public: libelle(`horaires.cours.${i}`, o.public, 'Public', 60, false) }
  })
  if (cours.length > 40) e('horaires', '40 cours au plus')

  // Garderie du mercredi.
  const g = objet(r.garderie)
  const lieux = tableau(g.lieux).map((l) => texte(l)).filter(Boolean)
  if (!lieux.length || lieux.length > 10 || lieux.some((l) => l.length > 80)) e('garderie.lieux', 'De 1 à 10 lieux, 80 caractères chacun')
  const debutG = texte(g.debut)
  const finG = texte(g.fin)
  if (!estMercredi(debutG) || !estMercredi(finG)) e('garderie', 'Premier et dernier jour : des mercredis')
  else if (debutG > finG) e('garderie', 'Le premier mercredi doit précéder le dernier')
  const fermes = [...new Set(tableau(g.fermes).map((d) => texte(d)))].sort()
  if (fermes.some((d) => !estMercredi(d))) e('garderie.fermes', 'Mercredis fermés : des mercredis')
  const lim = objet(g.limite)
  const jours = entier(lim.jours)
  const heureLimite = texte(lim.heure)
  if (!(jours >= 0 && jours <= 6) || !HEURE.test(heureLimite)) e('garderie.limite', 'Délai invalide (0 à 6 jours avant, heure HH:MM)')
  const garderie: ReglagesGarderie = {
    lieux,
    debut: debutG,
    fin: finG,
    fermes,
    limite: { jours, heure: heureLimite },
    provisoire: g.provisoire === true,
  }

  const valeur: Referentiel = { categories, tarifs, echeances3Fois, horaires: { cours, provisoire: h.provisoire === true }, garderie }
  return Object.keys(erreurs).length ? { ok: false, erreurs } : { ok: true, valeur }
}

// --- Affichage des horaires ---

export { heure } from './heures'

/** Cours triés par jour de la semaine puis par heure. */
export const coursTries = (cours: Cours[]) =>
  [...cours].sort((x, y) => JOURS.indexOf(x.jour) - JOURS.indexOf(y.jour) || x.debut.localeCompare(y.debut))
