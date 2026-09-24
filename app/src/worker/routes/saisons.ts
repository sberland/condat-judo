// Saisons et référentiels (spec 003) — gestion par le bureau, monté sous /api/admin/saisons (le
// routeur admin impose déjà les rôles `bureau` / `admin`). La lecture publique de la saison
// courante est dans index.ts (/api/saison).
import { Hono } from 'hono';
import { copierReferentiel, saisonSuivante, validerReferentiel } from '../../../web/src/content/referentiel';
import type { AppEnv } from '../droits';
import { COLONNES_SAISON, versSaison } from '../saison';

export const saisons = new Hono<AppEnv>();

type LigneSaison = Parameters<typeof versSaison>[0];

// Toutes les saisons, avec ce qui s'y rattache (dossiers, paiements).
saisons.get('/', async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT s.id, s.libelle, s.debut, s.fin, s.courante, s.inscriptions_ouvertes, s.modifie_le,
            (SELECT count(*) FROM adhesions d WHERE d.saison = s.id) AS dossiers,
            (SELECT count(*) FROM paiements p WHERE p.saison = s.id) AS paiements
     FROM saisons s ORDER BY s.id DESC`,
  ).all<{ id: string; courante: number; inscriptions_ouvertes: number } & Record<string, unknown>>();
  return c.json(results.map((s) => ({ ...s, courante: s.courante === 1, inscriptions_ouvertes: s.inscriptions_ouvertes === 1 })));
});

saisons.get('/:id', async (c) => {
  const l = await c.env.DB.prepare(`SELECT ${COLONNES_SAISON} FROM saisons WHERE id = ?`).bind(c.req.param('id')).first<LigneSaison>();
  return l ? c.json(versSaison(l)) : c.json({ error: 'Saison introuvable' }, 404);
});

// Enregistre le référentiel (validé en entier) et l'ouverture des inscriptions.
saisons.put('/:id', async (c) => {
  const corps = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const r = validerReferentiel(corps.referentiel);
  if (!r.ok) return c.json({ error: 'Référentiel invalide', erreurs: r.erreurs }, 400);
  const res = await c.env.DB.prepare(
    `UPDATE saisons SET referentiel = ?, inscriptions_ouvertes = ?, modifie_le = datetime('now'), modifie_par = ? WHERE id = ?`,
  )
    .bind(JSON.stringify(r.valeur), corps.inscriptions_ouvertes === true ? 1 : 0, c.get('utilisateur').id, c.req.param('id'))
    .run();
  if (!res.meta.changes) return c.json({ error: 'Saison introuvable' }, 404);
  return c.json({ ok: true });
});

// Prépare la saison suivante par copie (années de naissance et dates décalées d'un an).
saisons.post('/:id/suivante', async (c) => {
  const l = await c.env.DB.prepare(`SELECT ${COLONNES_SAISON} FROM saisons WHERE id = ?`).bind(c.req.param('id')).first<LigneSaison>();
  if (!l) return c.json({ error: 'Saison introuvable' }, 404);
  const suivante = saisonSuivante(l.id);
  const existe = await c.env.DB.prepare('SELECT 1 FROM saisons WHERE id = ?').bind(suivante.id).first();
  if (existe) return c.json({ error: `La saison ${suivante.libelle} existe déjà` }, 409);
  await c.env.DB.prepare(
    `INSERT INTO saisons (id, libelle, debut, fin, courante, inscriptions_ouvertes, referentiel, modifie_par) VALUES (?, ?, ?, ?, 0, 0, ?, ?)`,
  )
    .bind(suivante.id, suivante.libelle, suivante.debut, suivante.fin, JSON.stringify(copierReferentiel(versSaison(l).referentiel)), c.get('utilisateur').id)
    .run();
  return c.json({ id: suivante.id }, 201);
});

// Bascule : cette saison devient la saison courante (dossiers, trésorerie, accords, vitrine).
saisons.post('/:id/courante', async (c) => {
  const id = c.req.param('id');
  const existe = await c.env.DB.prepare('SELECT 1 FROM saisons WHERE id = ?').bind(id).first();
  if (!existe) return c.json({ error: 'Saison introuvable' }, 404);
  await c.env.DB.batch([
    c.env.DB.prepare('UPDATE saisons SET courante = 0 WHERE courante = 1'),
    c.env.DB.prepare("UPDATE saisons SET courante = 1, modifie_le = datetime('now'), modifie_par = ? WHERE id = ?").bind(c.get('utilisateur').id, id),
  ]);
  return c.json({ ok: true });
});

// Suppression d'une saison préparée par erreur : ni courante, ni dossier, ni paiement.
saisons.delete('/:id', async (c) => {
  const id = c.req.param('id');
  const s = await c.env.DB.prepare(
    `SELECT courante, (SELECT count(*) FROM adhesions WHERE saison = ?1) + (SELECT count(*) FROM paiements WHERE saison = ?1) AS usages
     FROM saisons WHERE id = ?1`,
  )
    .bind(id)
    .first<{ courante: number; usages: number }>();
  if (!s) return c.json({ error: 'Saison introuvable' }, 404);
  if (s.courante || s.usages) return c.json({ error: 'Saison courante, ou déjà utilisée par des dossiers : suppression impossible' }, 409);
  await c.env.DB.prepare('DELETE FROM saisons WHERE id = ?').bind(id).run();
  return c.json({ ok: true });
});
