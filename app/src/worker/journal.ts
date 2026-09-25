// Journal des accès sensibles (spec 019) : qui a consulté ou modifié les coordonnées d'une famille.
// Un middleware posé sur les routeurs du bureau et du trésorier enregistre, après une réponse
// réussie, l'entrée correspondant au motif de la route. Conservé un an (purge hebdomadaire).
import type { MiddlewareHandler } from 'hono';
import { routePath } from 'hono/route';
import type { AppEnv } from './droits';

export type ActionJournal = 'consultation' | 'modification' | 'suppression' | 'export' | 'lien_connexion' | 'deconnexion';
export type CibleJournal = 'adherent' | 'compte' | 'comptes' | 'famille';

type Regle = { methode: string; motif: RegExp; action: ActionJournal; cible: CibleJournal; detail?: string };

const R = (methode: string, motif: RegExp, action: ActionJournal, cible: CibleJournal, detail?: string): Regle => ({ methode, motif, action, cible, detail });

// Motifs des routes (fin du chemin déclaré) : `:id` désigne la cible.
const REGLES: Regle[] = [
  R('GET', /\/adherents\/:id$/, 'consultation', 'adherent'),
  R('POST', /\/adherents$/, 'modification', 'adherent', 'création'),
  R('PUT', /\/adherents\/:id$/, 'modification', 'adherent', 'identité'),
  R('DELETE', /\/adherents\/:id$/, 'suppression', 'adherent'),
  R('POST', /\/adherents\/:id\/restaurer$/, 'modification', 'adherent', 'restauration'),
  R('PUT', /\/adherents\/:id\/responsables\/:userId$/, 'modification', 'adherent', 'responsable'),
  R('DELETE', /\/adherents\/:id\/responsables\/:userId$/, 'modification', 'adherent', 'responsable retiré'),
  R('POST', /\/adherents\/:id\/personnes-autorisees$/, 'modification', 'adherent', 'personne autorisée'),
  R('DELETE', /\/adherents\/:id\/personnes-autorisees\/:pid$/, 'modification', 'adherent', 'personne autorisée retirée'),
  R('PUT', /\/adherents\/:id\/photo$/, 'modification', 'adherent', 'photo'),
  R('DELETE', /\/adherents\/:id\/photo$/, 'modification', 'adherent', 'photo retirée'),
  R('PUT', /\/adherents\/:id\/adhesion$/, 'modification', 'adherent', 'dossier'),
  R('DELETE', /\/adherents\/:id\/adhesion$/, 'suppression', 'adherent', 'dossier'),
  R('GET', /\/comptes$/, 'consultation', 'comptes'),
  R('POST', /\/comptes$/, 'modification', 'compte', 'création'),
  R('PUT', /\/comptes\/:id$/, 'modification', 'compte', 'coordonnées'),
  R('PUT', /\/comptes\/:id\/roles$/, 'modification', 'compte', 'rôles'),
  R('DELETE', /\/comptes\/:id$/, 'suppression', 'compte'),
  R('POST', /\/comptes\/:id\/lien$/, 'lien_connexion', 'compte'),
  R('DELETE', /\/comptes\/:id\/sessions$/, 'deconnexion', 'compte'),
  R('GET', /\/comptes\/:id\/export$/, 'export', 'compte'),
  R('GET', /\/familles\/:id$/, 'consultation', 'famille', 'paiements'),
];

export type EntreeJournal = { action: ActionJournal; cible: CibleJournal; cible_id: number | null; detail: string | null };

/** Entrée à journaliser pour une requête réussie, ou null (route non sensible). */
export function entreeJournal(methode: string, route: string, params: Record<string, string>): EntreeJournal | null {
  const r = REGLES.find((x) => x.methode === methode && x.motif.test(route));
  if (!r) return null;
  const id = Number(params.id);
  return { action: r.action, cible: r.cible, cible_id: Number.isInteger(id) && id > 0 ? id : null, detail: r.detail ?? null };
}

/** Middleware : journalise après la réponse, seulement si elle a réussi. */
export const journaliser: MiddlewareHandler<AppEnv> = async (c, next) => {
  await next();
  if (c.res.status >= 400) return;
  // routePath(c) après next() : la route qui a répondu (l'index -1 désignerait la route de repli '*').
  const e = entreeJournal(c.req.method, routePath(c), c.req.param() as Record<string, string>);
  if (!e) return;
  await c.env.DB.prepare('INSERT INTO journal_acces (user_id, action, cible, cible_id, detail) VALUES (?, ?, ?, ?, ?)')
    .bind(c.get('utilisateur').id, e.action, e.cible, e.cible_id, e.detail)
    .run();
};

// --- Consultation du journal (spec 023) : filtres par période, membre du bureau, type d'action ---

export const ACTIONS_JOURNAL: readonly ActionJournal[] = ['consultation', 'modification', 'suppression', 'export', 'lien_connexion', 'deconnexion'];

/** Début d'un jour en heure de Paris, exprimé en UTC au format de stockage (« AAAA-MM-JJ HH:MM:SS »). */
export function debutJourParis(date: string): string {
  // Décalage de Paris ce jour-là (1 h en hiver, 2 h en été), lu à midi UTC.
  const heureParis = Number(new Date(`${date}T12:00:00Z`).toLocaleString('en-GB', { timeZone: 'Europe/Paris', hour: '2-digit', hour12: false }));
  return new Date(Date.parse(`${date}T00:00:00Z`) - (heureParis - 12) * 3_600_000).toISOString().slice(0, 19).replace('T', ' ');
}

export type FiltresJournal = { depuis: string | null; avant: string | null; acteur: number | null; action: ActionJournal | null };

const dateValide = (v: string | undefined): v is string => !!v && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(`${v}T00:00:00Z`));

/**
 * Filtres de la requête (`du`, `au` en jours de Paris inclus, `acteur` = users.id, `action`) ;
 * une valeur invalide est ignorée. `depuis` / `avant` : bornes UTC [depuis, avant[.
 */
export function filtresJournal(q: { du?: string; au?: string; acteur?: string; action?: string }): FiltresJournal {
  const lendemain = (d: string) => new Date(Date.parse(`${d}T00:00:00Z`) + 86_400_000).toISOString().slice(0, 10);
  const acteur = Number(q.acteur);
  return {
    depuis: dateValide(q.du) ? debutJourParis(q.du) : null,
    avant: dateValide(q.au) ? debutJourParis(lendemain(q.au)) : null,
    acteur: Number.isInteger(acteur) && acteur > 0 ? acteur : null,
    action: ACTIONS_JOURNAL.includes(q.action as ActionJournal) ? (q.action as ActionJournal) : null,
  };
}
