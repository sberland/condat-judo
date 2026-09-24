import { Hono } from 'hono';
import pkg from '../../package.json';
import { connexionRequise, protectionCsrf, type AppEnv } from './droits';
import { admin } from './routes/admin';
import { famille } from './routes/famille';

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
  return c.json(utilisateur);
});

// --- Espaces connectés (spec 004) ---

api.route('/admin', admin);
api.route('/famille', famille);

api.all('*', (c) => c.json({ error: 'Not found' }, 404));

app.route('/api', api);

// Fallback : tout ce qui n'est pas /api/* → fichiers statiques (Workers Assets, SPA)
app.all('*', (c) => c.env.ASSETS.fetch(c.req.raw));

export default app;
