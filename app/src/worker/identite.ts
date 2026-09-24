// --- Seam d'identité (migration-friendly : l'autorisation ne dépend jamais de l'authentification) ---
//
// Frontière unique requête → utilisateur interne. Un fournisseur produit une Identite
// { provider, subject, email } ; la table `identites` la relie à `users.id`, seule identité
// que le reste du code connaisse. Tous les droits référencent `users.id` — jamais l'email.
// Ajouter un mode d'authentification = ajouter un fournisseur ici.
//
// ⚠️ Cloudflare Access n'est PAS un fournisseur d'identité de l'application : c'est un simple
// verrou d'accès au site de qualification, sans aucun lien avec l'authentification de l'app
// (décision du 2026-09-23). Aucune information d'Access n'est lue ici.
//
// Fournisseurs : `dev` (local uniquement) ; demain l'authentification applicative (chantier auth).
// Détail : workspace/docs/technical-docs/identite-auth.md

import type { Env } from './env';

export type Provider = 'dev';

export type Identite = {
  provider: Provider;
  /** Identifiant opaque et stable chez le fournisseur. */
  subject: string;
  /** Email vérifié par le fournisseur — sert UNIQUEMENT à lier une première connexion. */
  email: string | null;
};

/** Rôles club, cumulables (table `user_roles`). Sans rôle : « famille » (droits dérivés des liens). */
export const ROLES = ['admin', 'bureau', 'tresorier', 'encadrant', 'contenu'] as const;
export type Role = (typeof ROLES)[number];

export type Utilisateur = {
  id: number;
  prenom: string;
  nom: string;
  email: string | null;
  telephone: string | null;
  roles: Role[];
  provider: Provider;
};

export type Resolution =
  | { statut: 'anonyme' }
  | { statut: 'inconnu'; identite: Identite }
  | { statut: 'ok'; utilisateur: Utilisateur };

// --- Fournisseurs ---

function identiteDev(env: Env): Identite | null {
  // Double verrou : ENVIRONMENT=local et DEV_SUBJECT n'existent que dans .dev.vars.
  if (env.ENVIRONMENT !== 'local' || !env.DEV_SUBJECT) return null;
  return { provider: 'dev', subject: env.DEV_SUBJECT, email: null };
}

export async function resolveIdentite(_request: Request, env: Env): Promise<Identite | null> {
  return identiteDev(env);
}

// --- Identité → utilisateur interne ---

type UtilisateurRow = { id: number; prenom: string; nom: string; email: string | null; telephone: string | null };

const COLONNES = 'u.id, u.prenom, u.nom, u.email, u.telephone';

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

export async function resolveUser(request: Request, env: Env): Promise<Resolution> {
  const identite = await resolveIdentite(request, env);
  if (!identite) return { statut: 'anonyme' };

  const row = (await parIdentite(env, identite)) ?? (await lierPremiereConnexion(env, identite));
  if (!row) return { statut: 'inconnu', identite };

  await env.DB.prepare(
    "UPDATE identites SET last_seen = datetime('now'), email_vu = COALESCE(?, email_vu) WHERE provider = ? AND subject = ?",
  )
    .bind(identite.email, identite.provider, identite.subject)
    .run();

  const roles = await env.DB.prepare('SELECT role FROM user_roles WHERE user_id = ? ORDER BY role')
    .bind(row.id)
    .all<{ role: Role }>();

  return {
    statut: 'ok',
    utilisateur: {
      id: row.id,
      prenom: row.prenom,
      nom: row.nom,
      email: row.email,
      telephone: row.telephone,
      roles: roles.results.map((r) => r.role),
      provider: identite.provider,
    },
  };
}
