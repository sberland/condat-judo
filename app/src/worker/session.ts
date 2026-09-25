// Connexion applicative (spec 005a) — liens de connexion personnels et sessions navigateur.
//
// Un lien, remis par le bureau (WhatsApp), ouvre une session sur l'appareil qui le reçoit ; la
// session (cookie __Host-session) dure 6 mois glissants. Les jetons sont aléatoires (256 bits) et
// seule leur empreinte SHA-256 est stockée : une fuite de la base ne donne aucun accès.
// La session alimente le fournisseur d'identité `app` du seam (identite.ts) : elle ne porte aucun
// droit, seulement un `users.id`.
import type { Env } from './env';

export const COOKIE_SESSION = '__Host-session';
export const DUREE_SESSION_JOURS = 180;
export const DUREE_LIEN_JOURS = 7;

// --- Jetons ---

/** Jeton aléatoire de 256 bits, en base64url sans remplissage (43 caractères). */
export function genererJeton(): string {
  const octets = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...octets)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

const FORMAT_JETON = /^[A-Za-z0-9_-]{43}$/;
export const jetonValide = (v: unknown): v is string => typeof v === 'string' && FORMAT_JETON.test(v);

/** Empreinte SHA-256 (hex) : seule forme d'un jeton qui entre en base. */
export async function empreinte(jeton: string): Promise<string> {
  const h = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(jeton));
  return [...new Uint8Array(h)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

// --- Cookie ---

/** Jeton de session présent dans l'en-tête Cookie, s'il a le bon format. */
export function jetonSession(request: Request): string | null {
  for (const morceau of (request.headers.get('Cookie') ?? '').split(';')) {
    const i = morceau.indexOf('=');
    if (i > 0 && morceau.slice(0, i).trim() === COOKIE_SESSION) {
      const v = morceau.slice(i + 1).trim();
      return jetonValide(v) ? v : null;
    }
  }
  return null;
}

// __Host- : cookie limité à ce nom d'hôte exact, Secure et Path=/ imposés par le navigateur.
// SameSite=Lax : envoyé en navigation depuis un lien externe (WhatsApp), pas par un formulaire
// d'un autre site (et toute écriture exige en plus l'en-tête anti-CSRF, cf. droits.ts).
export const cookieSession = (jeton: string) =>
  `${COOKIE_SESSION}=${jeton}; Path=/; Max-Age=${DUREE_SESSION_JOURS * 86400}; HttpOnly; Secure; SameSite=Lax`;

export const cookieSessionEfface = `${COOKIE_SESSION}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`;

// --- Sessions ---

/** Compte d'une session valide (non expirée, compte non supprimé), sinon null. */
export async function utilisateurDeSession(env: Env, jeton: string): Promise<number | null> {
  const row = await env.DB.prepare(
    `SELECT s.user_id FROM sessions s JOIN users u ON u.id = s.user_id
     WHERE s.empreinte = ? AND s.expire_le > datetime('now') AND u.supprime_le IS NULL`,
  )
    .bind(await empreinte(jeton))
    .first<{ user_id: number }>();
  return row?.user_id ?? null;
}

/** Ouvre une session pour ce compte ; renvoie le jeton à poser en cookie. */
export async function ouvrirSession(env: Env, userId: number): Promise<string> {
  const jeton = genererJeton();
  await env.DB.batch([
    // Ménage opportuniste des sessions expirées.
    env.DB.prepare("DELETE FROM sessions WHERE expire_le <= datetime('now')"),
    env.DB.prepare(
      `INSERT INTO sessions (empreinte, user_id, expire_le) VALUES (?, ?, datetime('now', '+${DUREE_SESSION_JOURS} days'))`,
    ).bind(await empreinte(jeton), userId),
  ]);
  return jeton;
}

/** Session glissante : repousse l'échéance, au plus une fois par jour. true = cookie à reposer. */
export async function prolongerSession(env: Env, jeton: string): Promise<boolean> {
  const res = await env.DB.prepare(
    `UPDATE sessions SET expire_le = datetime('now', '+${DUREE_SESSION_JOURS} days'), renouvele_le = datetime('now')
     WHERE empreinte = ? AND expire_le > datetime('now') AND renouvele_le <= datetime('now', '-1 day')`,
  )
    .bind(await empreinte(jeton))
    .run();
  return res.meta.changes > 0;
}

export async function fermerSession(env: Env, jeton: string): Promise<void> {
  await env.DB.prepare('DELETE FROM sessions WHERE empreinte = ?').bind(await empreinte(jeton)).run();
}

const annulerLiens = (env: Env, userId: number) =>
  env.DB.prepare(
    "UPDATE liens_connexion SET annule_le = datetime('now') WHERE user_id = ? AND utilise_le IS NULL AND annule_le IS NULL",
  ).bind(userId);

/** Coupe tous les accès d'un compte (sessions fermées, liens en attente annulés, passkeys
 * retirées — spec 005c : un téléphone perdu ne doit plus pouvoir se reconnecter) — à placer dans un batch. */
export function couperAcces(env: Env, userId: number): D1PreparedStatement[] {
  return [
    env.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(userId),
    annulerLiens(env, userId),
    env.DB.prepare('DELETE FROM passkeys WHERE user_id = ?').bind(userId),
  ];
}

// --- Liens de connexion ---

const LIEN_VALABLE = `utilise_le IS NULL AND annule_le IS NULL AND expire_le > datetime('now')
  AND user_id IN (SELECT id FROM users WHERE supprime_le IS NULL)`;

/** Crée un lien pour ce compte, en annulant ses liens encore en attente. */
export async function creerLien(
  env: Env,
  userId: number,
  creePar: number | null,
): Promise<{ jeton: string; expire_le: string }> {
  const jeton = genererJeton();
  const [, cree] = await env.DB.batch<{ expire_le: string }>([
    annulerLiens(env, userId),
    env.DB.prepare(
      `INSERT INTO liens_connexion (empreinte, user_id, cree_par, expire_le)
       VALUES (?, ?, ?, datetime('now', '+${DUREE_LIEN_JOURS} days')) RETURNING expire_le`,
    ).bind(await empreinte(jeton), userId, creePar),
  ]);
  return { jeton, expire_le: cree?.results[0]?.expire_le ?? '' };
}

/** Lien encore valable → prénom de la personne, pour l'accueillir. Ne consomme PAS le lien. */
export async function infosLien(env: Env, jeton: string): Promise<{ prenom: string } | null> {
  return env.DB.prepare(
    `SELECT u.prenom FROM liens_connexion l JOIN users u ON u.id = l.user_id WHERE l.empreinte = ? AND ${LIEN_VALABLE}`,
  )
    .bind(await empreinte(jeton))
    .first<{ prenom: string }>();
}

/** Consomme le lien (une seule fois, atomique) ; renvoie le compte, ou null s'il n'est plus valable. */
export async function consommerLien(env: Env, jeton: string): Promise<number | null> {
  const row = await env.DB.prepare(
    `UPDATE liens_connexion SET utilise_le = datetime('now') WHERE empreinte = ? AND ${LIEN_VALABLE} RETURNING user_id`,
  )
    .bind(await empreinte(jeton))
    .first<{ user_id: number }>();
  return row?.user_id ?? null;
}
