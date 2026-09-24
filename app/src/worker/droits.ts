// Contrôle d'accès de l'API — la vraie barrière (le masquage dans l'interface n'est jamais la
// sécurité). Tous les droits reposent sur `users.id` : rôles (`user_roles`) et liens
// responsable ↔ adhérent (`liens`). Cf. workspace/tasks/…/004-comptes-foyers-roles.md
import type { MiddlewareHandler } from 'hono';
import type { Env } from './env';
import { resolveUser, type Role, type Utilisateur } from './identite';

export type AppEnv = { Bindings: Env; Variables: { utilisateur: Utilisateur } };

/** En-tête exigé sur toute écriture : un formulaire d'un autre site ne peut pas l'ajouter, et un
 * script d'un autre site en est empêché par CORS (pas de pré-vol autorisé). Protection CSRF. */
export const EN_TETE_CSRF = 'X-Condat-Judo';

const METHODES_LECTURE = new Set(['GET', 'HEAD', 'OPTIONS']);

export const protectionCsrf: MiddlewareHandler<AppEnv> = async (c, next) => {
  if (!METHODES_LECTURE.has(c.req.method) && c.req.header(EN_TETE_CSRF) !== '1') {
    return c.json({ error: 'Requête refusée' }, 403);
  }
  await next();
};

/** Connexion obligatoire ; expose l'utilisateur interne à la suite (`c.get('utilisateur')`). */
export const connexionRequise: MiddlewareHandler<AppEnv> = async (c, next) => {
  const resolution = await resolveUser(c.req.raw, c.env);
  if (resolution.statut === 'anonyme') return c.json({ error: 'Non authentifié' }, 401);
  if (resolution.statut === 'inconnu') return c.json({ error: 'Compte non reconnu' }, 403);
  c.set('utilisateur', resolution.utilisateur);
  await next();
};

export const aUnRole = (u: Utilisateur, roles: readonly Role[]): boolean => u.roles.some((r) => roles.includes(r));

/** Au moins un des rôles (à placer après `connexionRequise`). */
export function roleRequis(...roles: Role[]): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    if (!aUnRole(c.get('utilisateur'), roles)) return c.json({ error: 'Accès refusé' }, 403);
    await next();
  };
}
