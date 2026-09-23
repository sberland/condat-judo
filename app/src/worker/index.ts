import { Hono } from 'hono';
import pkg from '../../package.json';
import type { Env } from './env';
import { resolveUser } from './identite';

const app = new Hono<{ Bindings: Env }>();
const api = new Hono<{ Bindings: Env }>();

// --- /api/health : public (sous réserve d'Access en amont) ---

api.get('/health', (c) =>
  c.json({ status: 'ok', version: pkg.version, environment: c.env.ENVIRONMENT }),
);

// --- /api/me : utilisateur connecté, via le seam d'identité ---

api.get('/me', async (c) => {
  const resolution = await resolveUser(c.req.raw, c.env);
  if (resolution.statut === 'anonyme') return c.json({ error: 'Non authentifié' }, 401);
  if (resolution.statut === 'inconnu') return c.json({ error: 'Compte non reconnu' }, 403);

  const { utilisateur } = resolution;
  await c.env.DB.prepare("UPDATE users SET last_login = datetime('now') WHERE id = ?")
    .bind(utilisateur.id)
    .run();
  return c.json(utilisateur);
});

api.all('*', (c) => c.json({ error: 'Not found' }, 404));

app.route('/api', api);

// Fallback : tout ce qui n'est pas /api/* → fichiers statiques (Workers Assets, SPA)
app.all('*', (c) => c.env.ASSETS.fetch(c.req.raw));

export default app;
