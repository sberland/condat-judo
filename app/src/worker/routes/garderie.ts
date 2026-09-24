// Garderie du mercredi (spec 012a) — suivi par le bureau, monté sous /api/admin/garderie (rôles
// `bureau` / `admin` imposés par le routeur admin). Le bureau ajoute ou retire un enfant sans
// délai ; les demandes des familles passent par /api/famille/garderie.
import { Hono } from 'hono';
import { estMercredi, maintenantParis, mercredisOuverts } from '../../../web/src/content/garderie';
import type { AppEnv } from '../droits';
import { saisonCourante } from '../saison';

export const garderie = new Hono<AppEnv>();

// Un mercredi : demandes par lieu ; par défaut le prochain mercredi ouvert.
garderie.get('/', async (c) => {
  const g = (await saisonCourante(c)).referentiel.garderie;
  const aujourdhui = maintenantParis().slice(0, 10);
  const ouverts = mercredisOuverts(g);
  const aVenir = ouverts.filter((m) => m >= aujourdhui);
  const date = c.req.query('date') ?? aVenir[0] ?? ouverts.at(-1) ?? aujourdhui;
  const { results } = await c.env.DB.prepare(
    `SELECT d.adherent_id, a.prenom, a.nom, a.date_naissance, d.lieu, d.demande_le,
            (SELECT u.prenom || ' ' || u.nom FROM users u WHERE u.id = d.demande_par) AS demande_par
     FROM garderie_demandes d JOIN adherents a ON a.id = d.adherent_id
     WHERE d.date = ? ORDER BY d.lieu, a.nom, a.prenom`,
  )
    .bind(date)
    .all();
  return c.json({ date, lieux: g.lieux, mercredis: aVenir.slice(0, 12), ouvert: ouverts.includes(date), demandes: results });
});

garderie.put('/:adherentId/:date', async (c) => {
  const date = c.req.param('date');
  if (!estMercredi(date)) return c.json({ error: 'Date invalide : un mercredi' }, 400);
  const g = (await saisonCourante(c)).referentiel.garderie;
  const corps = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const lieu = typeof corps.lieu === 'string' && g.lieux.includes(corps.lieu) ? corps.lieu : (g.lieux[0] ?? '');
  const adherent = await c.env.DB.prepare('SELECT 1 FROM adherents WHERE id = ? AND supprime_le IS NULL').bind(c.req.param('adherentId')).first();
  if (!adherent) return c.json({ error: 'Adhérent introuvable' }, 404);
  await c.env.DB.prepare(
    `INSERT INTO garderie_demandes (adherent_id, date, lieu, demande_par) VALUES (?, ?, ?, ?)
     ON CONFLICT (adherent_id, date) DO UPDATE SET lieu = excluded.lieu`,
  )
    .bind(Number(c.req.param('adherentId')), date, lieu, c.get('utilisateur').id)
    .run();
  return c.json({ ok: true });
});

garderie.delete('/:adherentId/:date', async (c) => {
  const res = await c.env.DB.prepare('DELETE FROM garderie_demandes WHERE adherent_id = ? AND date = ?')
    .bind(Number(c.req.param('adherentId')), c.req.param('date'))
    .run();
  if (!res.meta.changes) return c.json({ error: 'Demande introuvable' }, 404);
  return c.json({ ok: true });
});
