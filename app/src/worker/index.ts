import { Hono } from 'hono';
import pkg from '../../package.json';
import { connexionRequise, protectionCsrf, type AppEnv } from './droits';
import { admin } from './routes/admin';
import { auth } from './routes/auth';
import { competitions } from './routes/competitions';
import { encadrant } from './routes/encadrant';
import { famille } from './routes/famille';
import { tresorerie } from './routes/tresorerie';
import type { Env } from './env';
import { purgerRgpd } from './purge';
import { saisonCourante, saisonPublique } from './saison';
import { cookieSession, jetonSession, prolongerSession } from './session';

const app = new Hono<AppEnv>();
const api = new Hono<AppEnv>();

// Toute écriture de l'API exige l'en-tête anti-CSRF (cf. droits.ts).
api.use('*', protectionCsrf);

// --- /api/health : public ---

api.get('/health', (c) =>
  c.json({ status: 'ok', version: pkg.version, environment: c.env.ENVIRONMENT }),
);

// --- /api/me : utilisateur connecté, via le seam d'identité ---

api.get('/me', connexionRequise, async (c) => {
  const utilisateur = c.get('utilisateur');
  await c.env.DB.prepare("UPDATE users SET last_login = datetime('now') WHERE id = ?")
    .bind(utilisateur.id)
    .run();
  // Session glissante : le front appelle /me à chaque ouverture du site.
  const jeton = utilisateur.provider === 'app' ? jetonSession(c.req.raw) : null;
  if (jeton && (await prolongerSession(c.env, jeton))) c.header('Set-Cookie', cookieSession(jeton));
  return c.json(utilisateur);
});

// --- Connexion (spec 005a) — publique ---

api.route('/auth', auth);

// --- Compétitions (spec 009) — informations publiques ---

api.route('/competitions', competitions);

// --- Saison courante (spec 003) — publique : tarifs, horaires, catégories de la vitrine ---

api.get('/saison', async (c) => c.json(saisonPublique(await saisonCourante(c))));

// --- Espaces connectés (spec 004) ---

api.route('/admin', admin);
api.route('/famille', famille);
api.route('/tresorerie', tresorerie);
api.route('/encadrant', encadrant);

api.all('*', (c) => c.json({ error: 'Not found' }, 404));

app.route('/api', api);

// Fallback : tout ce qui n'est pas /api/* → fichiers statiques (Workers Assets, SPA)
app.all('*', (c) => c.env.ASSETS.fetch(c.req.raw));

export default {
  fetch: app.fetch,
  // Purge RGPD hebdomadaire (spec 019) — cf. [triggers] de wrangler.toml.
  scheduled(_evenement, env, ctx) {
    ctx.waitUntil(purgerRgpd(env).then((resultat) => console.log(resultat)));
  },
} satisfies ExportedHandler<Env>;
