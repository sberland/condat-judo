// Contenu du site administré par le club (spec 014) — un document JSON par type de contenu, en
// base (table `contenus`, historique dans `contenus_versions`). Ce module décrit chaque document
// champ par champ : la même description sert à la validation (Worker) et à l'éditeur générique
// (écran « Contenu du site »). ⚠️ Importé par le Worker : pas de DOM.
// Valeurs initiales et de repli : contenu-initial.ts.
import { enumerer } from './club'

// --- Documents ---

export type Contact = { email: string; telephone: string }

export type Club = {
  nomDojo: string
  adresse: string
  codePostal: string
  ville: string
  facebook: string
  /** « De septembre à juin » (pied de page, contact). */
  saisonResume: string
  saisonDetail: string
}

export type Association = { denomination: string; forme: string; rna: string; siren: string; siege: string; creation: string }

export type Personne = { role: string; nom: string }

export type Equipe = { professeur: Personne; bureau: Personne[] }

export type Discipline = {
  /** Identifiant stable (ancre de page, horaires) : non modifiable. */
  id: string
  nom: string
  accroche: string
  /** Fragment de l'accroche de l'accueil : « le judo pour tous les âges », … */
  enBref: string
  public: string
  paragraphes: string[]
  liste?: { intro: string; items: string[] }
  encart?: { titre: string; texte: string }
  conclusion?: string
  /** Texte à confirmer : visible en local / qualif, jamais en production. */
  provisoire?: boolean
}

export type Partenaire = { nom: string; activite: string; adresse: string; provisoire?: boolean }

export type ArticleReglement = { titre: string; paragraphes?: string[]; liste?: string[]; apresListe?: string }

export type Reglement = { miseAJour: string; articles: ArticleReglement[]; sources: { libelle: string; url: string }[] }

export type LienUtile = { libelle: string; description: string; url: string }

export type Contenus = {
  contact: Contact
  club: Club
  association: Association
  equipe: Equipe
  disciplines: { disciplines: Discipline[] }
  partenaires: { partenaires: Partenaire[] }
  reglement: Reglement
  liens: { liens: LienUtile[] }
}

export type CleContenu = keyof Contenus

/** « À compléter » : visible en local et en qualification avec un badge, jamais en production. */
export type StatutContenu = 'publie' | 'a_completer'

// --- Description des champs ---

type Base = { cle: string; libelle: string; aide?: string }

export type Champ =
  | (Base & { type: 'texte' | 'long' | 'url' | 'email' | 'tel'; requis?: boolean; max?: number })
  | (Base & { type: 'case' })
  /** Identifiant conservé tel quel, jamais affiché (liste fixe). */
  | (Base & { type: 'cache' })
  | (Base & { type: 'textes'; requis?: boolean; long?: boolean; element: string })
  | (Base & { type: 'objet'; champs: Champ[]; optionnel?: boolean })
  /** Liste d'objets ; `titre` = champ affiché en tête de chaque élément ; `fixe` : ni ajout ni retrait. */
  | (Base & { type: 'liste'; champs: Champ[]; element: string; titre: string; fixe?: boolean })

const texte = (cle: string, libelle: string, o: { aide?: string; requis?: boolean; max?: number } = {}): Champ => ({ type: 'texte', cle, libelle, requis: true, ...o })
const long = (cle: string, libelle: string, o: { aide?: string; requis?: boolean } = {}): Champ => ({ type: 'long', cle, libelle, requis: true, ...o })

export type Definition = {
  titre: string
  description: string
  /** Le statut « à compléter » a un sens (contenu masquable en production). */
  statut: boolean
  champs: Champ[]
}

export const DEFINITIONS: Record<CleContenu, Definition> = {
  contact: {
    titre: 'Coordonnées du club',
    description: 'E-mail et téléphone publiés sur la page Contact.',
    statut: true,
    champs: [
      { type: 'email', cle: 'email', libelle: 'E-mail du club', requis: true },
      { type: 'tel', cle: 'telephone', libelle: 'Téléphone du club', requis: true },
    ],
  },
  club: {
    titre: 'Dojo, réseaux et saison',
    description: 'Adresse du dojo (accueil, contact, itinéraire), page Facebook, période des cours.',
    statut: false,
    champs: [
      texte('nomDojo', 'Nom du lieu de pratique'),
      texte('adresse', 'Adresse'),
      texte('codePostal', 'Code postal', { max: 10 }),
      texte('ville', 'Ville'),
      { type: 'url', cle: 'facebook', libelle: 'Page Facebook', requis: true },
      texte('saisonResume', 'Période des cours, en bref', { aide: 'Ex. « De septembre à juin »' }),
      long('saisonDetail', 'Période des cours, en détail'),
    ],
  },
  association: {
    titre: 'Identité de l’association',
    description: 'Mentions légales et page « Données personnelles ».',
    statut: false,
    champs: [
      texte('denomination', 'Dénomination officielle'),
      texte('forme', 'Forme juridique'),
      texte('rna', 'N° RNA', { max: 20 }),
      texte('siren', 'SIREN', { max: 20 }),
      texte('siege', 'Siège social'),
      texte('creation', 'Création', { aide: 'Ex. « avril 2015 »' }),
    ],
  },
  equipe: {
    titre: 'Équipe',
    description: 'Professeur et membres du bureau (page « Le club ») ; le premier membre du bureau est le directeur de la publication.',
    statut: true,
    champs: [
      { type: 'objet', cle: 'professeur', libelle: 'Professeur', champs: [texte('role', 'Rôle'), texte('nom', 'Nom')] },
      { type: 'liste', cle: 'bureau', libelle: 'Bureau', element: 'un membre', titre: 'nom', champs: [texte('role', 'Rôle'), texte('nom', 'Nom')] },
    ],
  },
  disciplines: {
    titre: 'Disciplines',
    description: 'Présentation de chaque discipline (accueil, page Disciplines).',
    statut: false,
    champs: [
      {
        type: 'liste',
        cle: 'disciplines',
        libelle: 'Disciplines',
        element: 'une discipline',
        titre: 'nom',
        fixe: true,
        champs: [
          { type: 'cache', cle: 'id', libelle: 'Identifiant' },
          texte('nom', 'Nom'),
          texte('accroche', 'Accroche'),
          texte('enBref', 'En bref (accueil)', { aide: 'Complète « … » dans l’accroche de l’accueil, ex. « le judo pour tous les âges »' }),
          texte('public', 'Pour qui'),
          { type: 'textes', cle: 'paragraphes', libelle: 'Paragraphes', element: 'un paragraphe', long: true, requis: true },
          {
            type: 'objet',
            cle: 'liste',
            libelle: 'Liste à puces',
            optionnel: true,
            champs: [texte('intro', 'Introduction'), { type: 'textes', cle: 'items', libelle: 'Éléments', element: 'un élément', requis: true }],
          },
          { type: 'objet', cle: 'encart', libelle: 'Encart', optionnel: true, champs: [texte('titre', 'Titre'), long('texte', 'Texte')] },
          long('conclusion', 'Conclusion', { requis: false }),
          { type: 'case', cle: 'provisoire', libelle: 'À compléter', aide: 'Masquée sur le site public, visible sur le site de test' },
        ],
      },
    ],
  },
  partenaires: {
    titre: 'Partenaires',
    description: 'Commerces et partenaires du club (page « Le club »).',
    statut: true,
    champs: [
      {
        type: 'liste',
        cle: 'partenaires',
        libelle: 'Partenaires',
        element: 'un partenaire',
        titre: 'nom',
        champs: [
          texte('nom', 'Nom'),
          texte('activite', 'Activité'),
          texte('adresse', 'Adresse'),
          { type: 'case', cle: 'provisoire', libelle: 'À compléter', aide: 'Masqué sur le site public, visible sur le site de test' },
        ],
      },
    ],
  },
  reglement: {
    titre: 'Règlement intérieur',
    description: 'Articles du règlement (page Règlement) et références.',
    statut: true,
    champs: [
      texte('miseAJour', 'Mis à jour en', { aide: 'Ex. « septembre 2026 »' }),
      {
        type: 'liste',
        cle: 'articles',
        libelle: 'Articles',
        element: 'un article',
        titre: 'titre',
        champs: [
          texte('titre', 'Titre'),
          { type: 'textes', cle: 'paragraphes', libelle: 'Paragraphes', element: 'un paragraphe', long: true },
          { type: 'textes', cle: 'liste', libelle: 'Liste à puces', element: 'un élément', long: true },
          long('apresListe', 'Après la liste', { requis: false }),
        ],
      },
      {
        type: 'liste',
        cle: 'sources',
        libelle: 'Références',
        element: 'une référence',
        titre: 'libelle',
        champs: [texte('libelle', 'Libellé'), { type: 'url', cle: 'url', libelle: 'Adresse (https://…)', requis: true }],
      },
    ],
  },
  liens: {
    titre: 'Liens utiles',
    description: 'Liens vers la fédération, la commune… (page « Le club »).',
    statut: true,
    champs: [
      {
        type: 'liste',
        cle: 'liens',
        libelle: 'Liens',
        element: 'un lien',
        titre: 'libelle',
        champs: [texte('libelle', 'Libellé'), texte('description', 'Description'), { type: 'url', cle: 'url', libelle: 'Adresse (https://…)', requis: true }],
      },
    ],
  },
}

export const CLES_CONTENU = Object.keys(DEFINITIONS) as CleContenu[]

// --- Validation (écran et Worker) ---

export type ErreursContenu = Record<string, string>

const MAX = { texte: 200, long: 2000, url: 500, email: 200, tel: 30 } as const
const MAX_LISTE = 60

const nettoyer = (v: unknown) => (typeof v === 'string' ? v.trim().replace(/\s+/g, ' ') : '')

function valeurVide(v: unknown): boolean {
  if (v === undefined || v === null || v === false || v === '') return true
  if (Array.isArray(v)) return v.every(valeurVide)
  if (typeof v === 'object') return Object.values(v).every(valeurVide)
  return false
}

/** Valeur propre d'un objet décrit par `champs` ; les erreurs sont indexées par chemin (« bureau.0.nom »). */
export function validerChamps(champs: Champ[], v: unknown, erreurs: ErreursContenu, chemin = ''): Record<string, unknown> {
  const source = v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {}
  const sortie: Record<string, unknown> = {}
  for (const c of champs) {
    const ici = `${chemin}${c.cle}`
    const brut = source[c.cle]
    switch (c.type) {
      case 'texte':
      case 'long':
      case 'url':
      case 'email':
      case 'tel': {
        const s = nettoyer(brut)
        if (!s) {
          if (c.requis) erreurs[ici] = 'Obligatoire'
          break
        }
        if (s.length > (c.max ?? MAX[c.type])) erreurs[ici] = `${c.max ?? MAX[c.type]} caractères au plus`
        else if (c.type === 'url' && !/^https:\/\/[^\s]+\.[^\s]+$/.test(s)) erreurs[ici] = 'Adresse web invalide (https://…)'
        else if (c.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) erreurs[ici] = 'E-mail invalide'
        else if (c.type === 'tel' && !/^\+?[\d .]{10,20}$/.test(s)) erreurs[ici] = 'Téléphone invalide'
        sortie[c.cle] = s
        break
      }
      case 'case':
        if (brut === true) sortie[c.cle] = true
        break
      case 'cache':
        if (typeof brut === 'string' && /^[a-z0-9-]{1,40}$/.test(brut)) sortie[c.cle] = brut
        else erreurs[ici] = 'Identifiant invalide'
        break
      case 'textes': {
        const lignes = (Array.isArray(brut) ? brut : []).map(nettoyer).filter(Boolean)
        const max = c.long ? MAX.long : MAX.texte
        if (lignes.some((l) => l.length > max)) erreurs[ici] = `${max} caractères au plus par ${c.element.replace(/^une? /, '')}`
        if (lignes.length > MAX_LISTE) erreurs[ici] = `${MAX_LISTE} au plus`
        if (!lignes.length) {
          if (c.requis) erreurs[ici] = `Au moins ${c.element}`
          break
        }
        sortie[c.cle] = lignes
        break
      }
      case 'objet':
        if (c.optionnel && valeurVide(brut)) break
        sortie[c.cle] = validerChamps(c.champs, brut, erreurs, `${ici}.`)
        break
      case 'liste': {
        const elements = Array.isArray(brut) ? brut : []
        if (elements.length > MAX_LISTE) erreurs[ici] = `${MAX_LISTE} au plus`
        sortie[c.cle] = elements.slice(0, MAX_LISTE).map((e, i) => validerChamps(c.champs, e, erreurs, `${ici}.${i}.`))
        break
      }
    }
  }
  return sortie
}

export function validerContenu<K extends CleContenu>(cle: K, valeur: unknown): { ok: true; valeur: Contenus[K] } | { ok: false; erreurs: ErreursContenu } {
  const erreurs: ErreursContenu = {}
  const propre = validerChamps(DEFINITIONS[cle].champs, valeur, erreurs)
  return Object.keys(erreurs).length ? { ok: false, erreurs } : { ok: true, valeur: propre as Contenus[K] }
}

// --- Déductions pour les pages publiques ---

export const adresseComplete = (c: Club) => `${c.adresse}, ${c.codePostal} ${c.ville}`

/** Liens d'itinéraire (pas de carte intégrée : elle déposerait des cookies tiers). */
export function itineraire(c: Club) {
  const adresse = adresseComplete(c)
  return {
    adresse,
    googleMaps: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(adresse)}`,
    openStreetMap: `https://www.openstreetmap.org/search?query=${encodeURIComponent(adresse)}`,
  }
}

/** Disciplines présentées au public (hors textes à compléter). */
export const disciplinesPubliques = (d: Discipline[]) => d.filter((x) => !x.provisoire)

/** « judo, jujitsu, taïso et yoga » */
export const listeDisciplines = (d: Discipline[]) => enumerer(disciplinesPubliques(d).map((x) => x.nom.toLocaleLowerCase('fr-FR')))
