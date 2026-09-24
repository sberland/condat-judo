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
