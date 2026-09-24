// Connexion applicative (spec 005a) — routes publiques : lien de connexion, déconnexion.
// Le jeton du lien voyage dans le fragment de l'URL (/connexion#…) puis dans le corps de ces
// requêtes POST : jamais dans une URL vue par le serveur, donc jamais journalisé. Toutes ces
// routes sont des écritures → en-tête anti-CSRF exigé (protectionCsrf, index.ts).
import { Hono, type Context } from 'hono';
import type { AppEnv } from '../droits';
import {
  consommerLien,
  cookieSession,
  cookieSessionEfface,
  fermerSession,
  infosLien,
  jetonSession,
  jetonValide,
  ouvrirSession,
} from '../session';

export const auth = new Hono<AppEnv>();

const LIEN_PERIME = 'Ce lien n’est plus valable';

async function jetonDuCorps(c: Context<AppEnv>): Promise<string | null> {
  try {
    const { jeton } = (await c.req.json()) as { jeton?: unknown };
    return jetonValide(jeton) ? jeton : null;
  } catch {
    return null;
  }
}

// Accueil du lien (« Bonjour Claire ») : vérifie sans consommer — un aperçu ou un rechargement
// de page ne doit pas griller le lien.
auth.post('/lien/infos', async (c) => {
  const jeton = await jetonDuCorps(c);
  const infos = jeton ? await infosLien(c.env, jeton) : null;
  return infos ? c.json(infos) : c.json({ error: LIEN_PERIME }, 410);
});

// Clic sur « Me connecter » : consomme le lien et ouvre la session sur cet appareil.
auth.post('/lien', async (c) => {
  const jeton = await jetonDuCorps(c);
  const userId = jeton ? await consommerLien(c.env, jeton) : null;
  if (!userId) return c.json({ error: LIEN_PERIME }, 410);

  // Une session déjà présente sur ce navigateur est remplacée (jamais réutilisée).
  const ancienne = jetonSession(c.req.raw);
  if (ancienne) await fermerSession(c.env, ancienne);

  // Première connexion : l'identité `app` est reliée au compte (« compte activé »).
  await c.env.DB.prepare("INSERT OR IGNORE INTO identites (provider, subject, user_id) VALUES ('app', ?, ?)")
    .bind(String(userId), userId)
    .run();
  c.header('Set-Cookie', cookieSession(await ouvrirSession(c.env, userId)));
  return c.json({ ok: true });
});

auth.post('/deconnexion', async (c) => {
  const jeton = jetonSession(c.req.raw);
  if (jeton) await fermerSession(c.env, jeton);
  c.header('Set-Cookie', cookieSessionEfface);
  return c.json({ ok: true });
});
