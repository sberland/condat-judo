// Connexion applicative (spec 005a) — routes publiques : lien de connexion, déconnexion ; passkey
// (spec 005c) : connexion (publique) et enregistrement (compte connecté).
// Le jeton du lien voyage dans le fragment de l'URL (/connexion#…) puis dans le corps de ces
// requêtes POST : jamais dans une URL vue par le serveur, donc jamais journalisé. Toutes ces
// routes sont des écritures → en-tête anti-CSRF exigé (protectionCsrf, index.ts).
import { Hono, type Context } from 'hono';
import { connexionRequise, type AppEnv } from '../droits';
import { optionsConnexion, optionsEnregistrement, origineAttendue, verifierConnexion, verifierEnregistrement } from '../passkey';
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

  await connecter(c, userId);
  return c.json({ ok: true });
});

/** Ouvre la session de ce compte sur ce navigateur (lien ou passkey). */
async function connecter(c: Context<AppEnv>, userId: number) {
  // Une session déjà présente sur ce navigateur est remplacée (jamais réutilisée).
  const ancienne = jetonSession(c.req.raw);
  if (ancienne) await fermerSession(c.env, ancienne);

  // Première connexion : l'identité `app` est reliée au compte (« compte activé »).
  await c.env.DB.prepare("INSERT OR IGNORE INTO identites (provider, subject, user_id) VALUES ('app', ?, ?)")
    .bind(String(userId), userId)
    .run();
  c.header('Set-Cookie', cookieSession(await ouvrirSession(c.env, userId)));
}

// --- Passkey (spec 005c) ---

const attendu = (c: Context<AppEnv>) => origineAttendue(c.req.header('Origin'), c.req.url);
const ORIGINE_REFUSEE = 'Origine de la requête non reconnue';
const PASSKEY_REFUSEE = 'Connexion refusée : cette passkey n’est pas reconnue. Utilisez votre lien de connexion.';

auth.post('/passkey/connexion/options', async (c) => {
  const a = attendu(c);
  if (!a) return c.json({ error: ORIGINE_REFUSEE }, 400);
  return c.json(await optionsConnexion(c, a.rpID));
});

auth.post('/passkey/connexion', async (c) => {
  const a = attendu(c);
  if (!a) return c.json({ error: ORIGINE_REFUSEE }, 400);
  const corps = (await c.req.json().catch(() => null)) as unknown;
  const userId = await verifierConnexion(c, a, corps).catch(() => null);
  if (userId === 'inconnue') return c.json({ error: PASSKEY_REFUSEE, inconnue: true }, 401);
  if (!userId) return c.json({ error: PASSKEY_REFUSEE }, 401);
  await connecter(c, userId);
  return c.json({ ok: true });
});

auth.post('/passkey/enregistrement/options', connexionRequise, async (c) => {
  const a = attendu(c);
  if (!a) return c.json({ error: ORIGINE_REFUSEE }, 400);
  return c.json(await optionsEnregistrement(c, a.rpID));
});

auth.post('/passkey/enregistrement', connexionRequise, async (c) => {
  const a = attendu(c);
  if (!a) return c.json({ error: ORIGINE_REFUSEE }, 400);
  const corps = (await c.req.json().catch(() => ({}))) as { reponse?: unknown; appareil?: unknown };
  const ok = await verifierEnregistrement(c, a, corps.reponse, corps.appareil).catch(() => false);
  return ok ? c.json({ ok: true }, 201) : c.json({ error: 'Activation impossible : réessayez.' }, 400);
});

auth.post('/deconnexion', async (c) => {
  const jeton = jetonSession(c.req.raw);
  if (jeton) await fermerSession(c.env, jeton);
  c.header('Set-Cookie', cookieSessionEfface);
  return c.json({ ok: true });
});
