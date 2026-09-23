// --- Seam d'identité (migration-friendly : l'autorisation ne dépend jamais de l'authentification) ---
//
// Frontière unique requête → utilisateur interne. Un fournisseur produit une Identite
// { provider, subject, email } ; la table `identites` la relie à `users.id`, seule identité
// que le reste du code connaisse. Tous les droits référencent `users.id` — jamais l'email,
// jamais un artefact Access. Changer d'authentification = ajouter un fournisseur ici.
// Détail : workspace/docs/technical-docs/identite-auth.md

import { verifyAccessJwt } from './access-jwt';
import type { Env } from './env';

export type Provider = 'cf-access' | 'dev';

export type Identite = {
  provider: Provider;
  /** Identifiant opaque et stable chez le fournisseur (claim `sub` pour Access). */
  subject: string;
  /** Email vérifié par le fournisseur — sert UNIQUEMENT à lier une première connexion. */
  email: string | null;
};

export type Role = 'admin' | 'membre';

export type Utilisateur = {
  id: number;
  prenom: string;
  nom: string;
  email: string | null;
  role: Role;
  provider: Provider;
};

export type Resolution =
  | { statut: 'anonyme' }
  | { statut: 'inconnu'; identite: Identite }
  | { statut: 'ok'; utilisateur: Utilisateur };

/** Sous-ensemble du contexte d'exécution Workers utile au seam (ctx.access). */
export type ContexteExecution = {
  waitUntil(promise: Promise<unknown>): void;
  readonly access?: CloudflareAccessContext;
};

// --- Fournisseurs ---
//
// Journalisation (visible via `wrangler tail`) : uniquement des informations non sensibles —
// jamais de jeton, jamais d'email.

// 1. Access via le runtime Workers (`ctx.access`). Sur *.workers.dev, Access authentifie en
//    amont mais ne transmet ni l'en-tête Cf-Access-Jwt-Assertion ni le cookie CF_Authorization
//    (constaté sur la preview, 2026-09-23) : l'identité validée est exposée par la plateforme
//    via ctx.access — non falsifiable par le client. On vérifie que l'audience est bien celle
//    de NOTRE application Access avant de lire l'identité.
async function identiteAccessRuntime(ctx: ContexteExecution | undefined, env: Env): Promise<Identite | null> {
  const access = ctx?.access;
  if (!access) return null;
  if (!env.CF_ACCESS_AUD || access.aud !== env.CF_ACCESS_AUD) {
    console.warn('[access] ctx.access refusé : audience', JSON.stringify({ recue: access.aud, attendue: env.CF_ACCESS_AUD ?? null }));
    return null;
  }
  const identity = await access.getIdentity();
  if (!identity) {
    console.warn('[access] ctx.access : identité indisponible');
    return null;
  }
  // user_uuid = identifiant utilisateur Access (= claim `sub` du JWT) : même `subject` quel que
  // soit le canal (runtime ou en-tête), donc même ligne `identites`.
  if (typeof identity.user_uuid !== 'string' || identity.user_uuid === '') {
    console.warn('[access] ctx.access : user_uuid absent — champs reçus :', Object.keys(identity).join(', '));
    return null;
  }
  return {
    provider: 'cf-access',
    subject: identity.user_uuid,
    email: typeof identity.email === 'string' ? identity.email.toLowerCase() : null,
  };
}

// 2. Access via le JWT de l'en-tête Cf-Access-Jwt-Assertion (domaine personnalisé), dont on
//    vérifie nous-mêmes la signature (access-jwt.ts).
async function identiteAccessJwt(request: Request, env: Env): Promise<Identite | null> {
  const token = request.headers.get('Cf-Access-Jwt-Assertion');
  if (!token) return null;
  if (!env.CF_ACCESS_TEAM_DOMAIN || !env.CF_ACCESS_AUD) {
    console.warn('[access] jeton reçu mais configuration absente (CF_ACCESS_TEAM_DOMAIN / CF_ACCESS_AUD)');
    return null;
  }
  try {
    const verification = await verifyAccessJwt(token, {
      teamDomain: env.CF_ACCESS_TEAM_DOMAIN,
      audience: env.CF_ACCESS_AUD,
    });
    if (!verification.ok) {
      console.warn('[access] jeton refusé :', verification.raison, JSON.stringify(verification.details ?? {}));
      return null;
    }
    const { claims } = verification;
    return { provider: 'cf-access', subject: claims.sub, email: claims.email?.toLowerCase() ?? null };
  } catch (error) {
    // Clés Access injoignables ou illisibles : on refuse plutôt que de deviner.
    console.error('[access] vérification impossible :', error instanceof Error ? error.message : String(error));
    return null;
  }
}

// 3. Dev local.
function identiteDev(env: Env): Identite | null {
  // Double verrou : ENVIRONMENT=local et DEV_SUBJECT n'existent que dans .dev.vars.
  if (env.ENVIRONMENT !== 'local' || !env.DEV_SUBJECT) return null;
  return { provider: 'dev', subject: env.DEV_SUBJECT, email: null };
}

export async function resolveIdentite(
  request: Request,
  env: Env,
  ctx?: ContexteExecution,
): Promise<Identite | null> {
  const identite =
    (await identiteAccessRuntime(ctx, env)) ?? (await identiteAccessJwt(request, env)) ?? identiteDev(env);
  if (!identite && env.ENVIRONMENT !== 'local' && new URL(request.url).pathname === '/api/me') {
    console.warn('[access] aucune identité sur /api/me (ni ctx.access, ni en-tête Cf-Access-Jwt-Assertion)');
  }
  return identite;
}

// --- Identité → utilisateur interne ---

type UtilisateurRow = { id: number; prenom: string; nom: string; email: string | null; role: string };

const COLONNES = 'u.id, u.prenom, u.nom, u.email, u.role';

async function parIdentite(env: Env, identite: Identite): Promise<UtilisateurRow | null> {
  return env.DB.prepare(
    `SELECT ${COLONNES} FROM identites i JOIN users u ON u.id = i.user_id
     WHERE i.provider = ? AND i.subject = ? AND u.supprime_le IS NULL`,
  )
    .bind(identite.provider, identite.subject)
    .first<UtilisateurRow>();
}

// Première connexion : relie l'identité au compte créé par un admin (invitation) via l'email
// vérifié par le fournisseur. C'est le SEUL usage de l'email : il ne confère aucun droit, et
// un compte déjà relié à ce fournisseur ne peut pas être « repris » par une autre identité.
async function lierPremiereConnexion(env: Env, identite: Identite): Promise<UtilisateurRow | null> {
  if (!identite.email) return null;
  const row = await env.DB.prepare(
    `SELECT ${COLONNES} FROM users u
     WHERE u.email = ? AND u.supprime_le IS NULL
       AND NOT EXISTS (SELECT 1 FROM identites i WHERE i.user_id = u.id AND i.provider = ?)`,
  )
    .bind(identite.email, identite.provider)
    .first<UtilisateurRow>();
  if (!row) return null;
  await env.DB.prepare(
    'INSERT OR IGNORE INTO identites (provider, subject, user_id, email_vu) VALUES (?, ?, ?, ?)',
  )
    .bind(identite.provider, identite.subject, row.id, identite.email)
    .run();
  return row;
}

export async function resolveUser(request: Request, env: Env, ctx?: ContexteExecution): Promise<Resolution> {
  const identite = await resolveIdentite(request, env, ctx);
  if (!identite) return { statut: 'anonyme' };

  const row = (await parIdentite(env, identite)) ?? (await lierPremiereConnexion(env, identite));
  if (!row) return { statut: 'inconnu', identite };

  await env.DB.prepare(
    "UPDATE identites SET last_seen = datetime('now'), email_vu = COALESCE(?, email_vu) WHERE provider = ? AND subject = ?",
  )
    .bind(identite.email, identite.provider, identite.subject)
    .run();

  return {
    statut: 'ok',
    utilisateur: {
      id: row.id,
      prenom: row.prenom,
      nom: row.nom,
      email: row.email,
      role: row.role as Role,
      provider: identite.provider,
    },
  };
}
