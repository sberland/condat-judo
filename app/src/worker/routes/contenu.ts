// Contenu du site administré par le club (spec 014) — monté sous /api/contenu. Lecture publique
// (toutes les pages de la vitrine, revalidée par ETag) ; modification par les rôles `contenu` et
// `admin` sous /gestion, chaque enregistrement étant versionné (30 dernières versions par contenu).
import { Hono, type Context } from 'hono';
import { etag } from 'hono/etag';
import { CLES_CONTENU, DEFINITIONS, validerContenu, type Champ, type CleContenu, type StatutContenu } from '../../../web/src/content/contenu';
import { connexionRequise, roleRequis, type AppEnv } from '../droits';

export const contenu = new Hono<AppEnv>();

const VERSIONS_GARDEES = 30;

const estCle = (v: string): v is CleContenu => (CLES_CONTENU as string[]).includes(v);

type Ligne = { cle: string; valeur: string; statut: StatutContenu; modifie_le: string };

// Public : les documents et leur statut (« a_completer » : l'écran les masque en production).
contenu.get('/', etag(), async (c) => {
  const { results } = await c.env.DB.prepare('SELECT cle, valeur, statut, modifie_le FROM contenus').all<Ligne>();
  c.header('Cache-Control', 'no-cache');
  return c.json(
    Object.fromEntries(results.filter((l) => estCle(l.cle)).map((l) => [l.cle, { valeur: JSON.parse(l.valeur), statut: l.statut, modifie_le: l.modifie_le }])),
  );
});

// --- Gestion : rôles contenu et admin ---

const gestion = new Hono<AppEnv>();
gestion.use('*', connexionRequise, roleRequis('contenu', 'admin'));

const AUTEUR = "(SELECT u.prenom || ' ' || u.nom FROM users u WHERE u.id = modifie_par)";

gestion.get('/', async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT cle, statut, modifie_le, ${AUTEUR} AS modifie_par,
            (SELECT count(*) FROM contenus_versions v WHERE v.cle = contenus.cle) AS versions
     FROM contenus`,
  ).all<{ cle: string; statut: StatutContenu; modifie_le: string; modifie_par: string | null; versions: number }>();
  return c.json(results.filter((l) => estCle(l.cle)));
});

gestion.get('/:cle', async (c) => {
  const cle = c.req.param('cle');
  if (!estCle(cle)) return c.json({ error: 'Contenu inconnu' }, 404);
  const [courant, versions] = await c.env.DB.batch([
    c.env.DB.prepare(`SELECT valeur, statut, modifie_le, ${AUTEUR} AS modifie_par FROM contenus WHERE cle = ?`).bind(cle),
    c.env.DB.prepare(`SELECT id, statut, modifie_le, ${AUTEUR} AS modifie_par FROM contenus_versions WHERE cle = ? ORDER BY id DESC`).bind(cle),
  ]);
  const l = courant?.results[0] as (Omit<Ligne, 'cle'> & { modifie_par: string | null }) | undefined;
  if (!l) return c.json({ error: 'Contenu introuvable' }, 404);
  return c.json({ cle, valeur: JSON.parse(l.valeur), statut: l.statut, modifie_le: l.modifie_le, modifie_par: l.modifie_par, versions: versions?.results ?? [] });
});

gestion.get('/:cle/versions/:id', async (c) => {
  const v = await c.env.DB.prepare('SELECT valeur, statut, modifie_le FROM contenus_versions WHERE cle = ? AND id = ?')
    .bind(c.req.param('cle'), Number(c.req.param('id')) || 0)
    .first<{ valeur: string; statut: StatutContenu; modifie_le: string }>();
  return v ? c.json({ ...v, valeur: JSON.parse(v.valeur) }) : c.json({ error: 'Version introuvable' }, 404);
});

/** Identifiants des éléments d'une liste fixe (ex. disciplines) : ni ajout ni retrait possible. */
function identifiantsFixes(champs: Champ[], valeur: unknown): string {
  const v = (valeur ?? {}) as Record<string, unknown>;
  return champs
    .filter((c): c is Extract<Champ, { type: 'liste' }> => c.type === 'liste' && !!c.fixe)
    .map((c) => {
      const id = c.champs.find((x) => x.type === 'cache')?.cle ?? 'id';
      return ((Array.isArray(v[c.cle]) ? v[c.cle] : []) as Record<string, unknown>[]).map((e) => String(e[id])).sort().join(',');
    })
    .join('|');
}

/** Enregistre une nouvelle valeur (validée) : contenu courant + version, historique limité. */
async function enregistrer(c: Context<AppEnv>, cle: CleContenu, valeurBrute: unknown, statutBrut: unknown) {
  const def = DEFINITIONS[cle];
  const r = validerContenu(cle, valeurBrute);
  if (!r.ok) return c.json({ error: 'Saisie invalide', erreurs: r.erreurs }, 400);
  const statut: StatutContenu = def.statut && statutBrut === 'a_completer' ? 'a_completer' : 'publie';
  const actuel = await c.env.DB.prepare('SELECT valeur FROM contenus WHERE cle = ?').bind(cle).first<{ valeur: string }>();
  if (actuel && identifiantsFixes(def.champs, JSON.parse(actuel.valeur)) !== identifiantsFixes(def.champs, r.valeur)) {
    return c.json({ error: 'La liste ne peut pas changer d’éléments (ajout ou retrait)' }, 409);
  }
  const json = JSON.stringify(r.valeur);
  const moi = c.get('utilisateur').id;
  await c.env.DB.batch([
    c.env.DB.prepare(
      `INSERT INTO contenus (cle, valeur, statut, modifie_par) VALUES (?1, ?2, ?3, ?4)
       ON CONFLICT (cle) DO UPDATE SET valeur = excluded.valeur, statut = excluded.statut, modifie_le = datetime('now'), modifie_par = excluded.modifie_par`,
    ).bind(cle, json, statut, moi),
    c.env.DB.prepare('INSERT INTO contenus_versions (cle, valeur, statut, modifie_par) VALUES (?, ?, ?, ?)').bind(cle, json, statut, moi),
    c.env.DB.prepare(
      `DELETE FROM contenus_versions WHERE cle = ?1
       AND id NOT IN (SELECT id FROM contenus_versions WHERE cle = ?1 ORDER BY id DESC LIMIT ${VERSIONS_GARDEES})`,
    ).bind(cle),
  ]);
  return c.json({ ok: true });
}

gestion.put('/:cle', async (c) => {
  const cle = c.req.param('cle');
  if (!estCle(cle)) return c.json({ error: 'Contenu inconnu' }, 404);
  const corps = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  return enregistrer(c, cle, corps.valeur, corps.statut);
});

// Revenir à une version : elle redevient le contenu courant (nouvelle version, l'historique est gardé).
gestion.post('/:cle/versions/:id/restaurer', async (c) => {
  const cle = c.req.param('cle');
  if (!estCle(cle)) return c.json({ error: 'Contenu inconnu' }, 404);
  const v = await c.env.DB.prepare('SELECT valeur, statut FROM contenus_versions WHERE cle = ? AND id = ?')
    .bind(cle, Number(c.req.param('id')) || 0)
    .first<{ valeur: string; statut: StatutContenu }>();
  if (!v) return c.json({ error: 'Version introuvable' }, 404);
  return enregistrer(c, cle, JSON.parse(v.valeur), v.statut);
});

contenu.route('/gestion', gestion);
