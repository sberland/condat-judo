// Validation des saisies de l'API (fonctions pures, testées). Chaque champ produit une valeur
// normalisée ou un message d'erreur lisible, affiché tel quel sous le champ côté front.

export type Resultat<T> = { ok: true; valeur: T } | { ok: false; erreurs: Record<string, string> };

type Corps = Record<string, unknown>;

const texte = (v: unknown): string => (typeof v === 'string' ? v.trim().replace(/\s+/g, ' ') : '');

/** Nom propre : « dupont-martin » → « Dupont-Martin » (la saisie en majuscules du papier disparaît). */
export function casseNom(v: string): string {
  return v.toLocaleLowerCase('fr-FR').replace(/(^|[\s'’-])(\p{L})/gu, (_, sep: string, l: string) => sep + l.toLocaleUpperCase('fr-FR'));
}

export function normaliserTelephone(v: string): string | null {
  const chiffres = v.replace(/[\s.\-()]/g, '');
  if (/^0\d{9}$/.test(chiffres)) return chiffres.replace(/(\d{2})(?=\d)/g, '$1 ').trim();
  if (/^\+\d{8,15}$/.test(chiffres)) return chiffres;
  return null;
}

function dateIsoValide(v: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const d = new Date(`${v}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
}

class Collecteur {
  erreurs: Record<string, string> = {};
  requis(corps: Corps, champ: string, libelle: string, max = 80): string {
    const v = texte(corps[champ]);
    if (!v) this.erreurs[champ] = `${libelle} obligatoire`;
    else if (v.length > max) this.erreurs[champ] = `${libelle} : ${max} caractères maximum`;
    return v;
  }
  optionnel(corps: Corps, champ: string, libelle: string, max = 120): string | null {
    const v = texte(corps[champ]);
    if (v.length > max) this.erreurs[champ] = `${libelle} : ${max} caractères maximum`;
    return v || null;
  }
  telephone(corps: Corps, champ: string): string | null {
    const v = texte(corps[champ]);
    if (!v) return null;
    const n = normaliserTelephone(v);
    if (!n) this.erreurs[champ] = 'Téléphone invalide (ex. 06 12 34 56 78)';
    return n;
  }
  email(corps: Corps, champ: string): string | null {
    const v = texte(corps[champ]).toLowerCase();
    if (!v) return null;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || v.length > 254) this.erreurs[champ] = 'Adresse e-mail invalide';
    return v;
  }
  resultat<T>(valeur: T): Resultat<T> {
    return Object.keys(this.erreurs).length ? { ok: false, erreurs: this.erreurs } : { ok: true, valeur };
  }
}

export type AdherentSaisi = {
  prenom: string;
  nom: string;
  date_naissance: string;
  sexe: 'F' | 'M';
  grade: string | null;
  numero_licence: string | null;
  adresse: string | null;
  code_postal: string | null;
  ville: string | null;
};

export function validerAdherent(corps: Corps, aujourdhui = new Date()): Resultat<AdherentSaisi> {
  const c = new Collecteur();
  const prenom = casseNom(c.requis(corps, 'prenom', 'Prénom'));
  const nom = casseNom(c.requis(corps, 'nom', 'Nom'));
  const date = texte(corps.date_naissance);
  if (!dateIsoValide(date)) c.erreurs.date_naissance = 'Date de naissance invalide';
  else if (date > aujourdhui.toISOString().slice(0, 10) || date < '1900-01-01') c.erreurs.date_naissance = 'Date de naissance hors limites';
  const sexe = corps.sexe;
  if (sexe !== 'F' && sexe !== 'M') c.erreurs.sexe = 'Sexe obligatoire';
  const codePostal = c.optionnel(corps, 'code_postal', 'Code postal', 5);
  if (codePostal && !/^\d{5}$/.test(codePostal)) c.erreurs.code_postal = 'Code postal à 5 chiffres';
  const ville = c.optionnel(corps, 'ville', 'Ville', 80);
  return c.resultat({
    prenom,
    nom,
    date_naissance: date,
    sexe: sexe as 'F' | 'M',
    grade: c.optionnel(corps, 'grade', 'Grade', 40),
    numero_licence: c.optionnel(corps, 'numero_licence', 'N° de licence', 30),
    adresse: c.optionnel(corps, 'adresse', 'Adresse', 160),
    code_postal: codePostal,
    ville, // saisie conservée : « Condat-sur-Vienne » ne suit pas la casse des noms propres
  });
}

export type CompteSaisi = { prenom: string; nom: string; email: string | null; telephone: string | null };

export function validerCompte(corps: Corps): Resultat<CompteSaisi> {
  const c = new Collecteur();
  const valeur = {
    prenom: casseNom(c.requis(corps, 'prenom', 'Prénom')),
    nom: casseNom(c.requis(corps, 'nom', 'Nom')),
    email: c.email(corps, 'email'),
    telephone: c.telephone(corps, 'telephone'),
  };
  if (!valeur.email && !valeur.telephone) c.erreurs.email = 'Indiquer au moins un e-mail ou un téléphone';
  return c.resultat(valeur);
}

export const QUALITES = ['mere', 'pere', 'tuteur', 'autre'] as const;
export type LienSaisi = {
  qualite: (typeof QUALITES)[number];
  peut_inscrire: 0 | 1;
  peut_recuperer: 0 | 1;
  est_contact: 0 | 1;
};

export function validerLien(corps: Corps): Resultat<LienSaisi> {
  const c = new Collecteur();
  const qualite = corps.qualite;
  if (!QUALITES.includes(qualite as LienSaisi['qualite'])) c.erreurs.qualite = 'Lien avec l’enfant obligatoire';
  const bool = (v: unknown): 0 | 1 => (v === true || v === 1 ? 1 : 0);
  return c.resultat({
    qualite: qualite as LienSaisi['qualite'],
    peut_inscrire: bool(corps.peut_inscrire),
    peut_recuperer: bool(corps.peut_recuperer),
    est_contact: bool(corps.est_contact),
  });
}

export type PersonneAutoriseeSaisie = { prenom: string; nom: string; lien: string; telephone: string | null };

export function validerPersonneAutorisee(corps: Corps): Resultat<PersonneAutoriseeSaisie> {
  const c = new Collecteur();
  return c.resultat({
    prenom: casseNom(c.requis(corps, 'prenom', 'Prénom')),
    nom: casseNom(c.requis(corps, 'nom', 'Nom')),
    lien: c.requis(corps, 'lien', 'Lien avec l’enfant', 40),
    telephone: c.telephone(corps, 'telephone'),
  });
}

export function validerTelephoneSeul(corps: Corps): Resultat<{ telephone: string | null }> {
  const c = new Collecteur();
  return c.resultat({ telephone: c.telephone(corps, 'telephone') });
}
