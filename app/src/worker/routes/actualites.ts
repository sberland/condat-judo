// Actualités du club (spec 013) — monté sous /api/actualites. Lecture : publiques pour tous,
// « réservées aux familles » pour tout compte connecté. Gestion (/gestion) : rôles bureau,
// gestion du site (`contenu`) et admin. Une photo au plus par actualité, publiée avec l'accord
// droit à l'image des enfants reconnaissables (confirmé par l'auteur).
import { Hono, type Context } from 'hono';
import { TAILLE_MAX_IMAGE_ACTUALITE, TAILLE_MORCEAU_IMAGE } from '../../../web/src/content/actualites';
import { connexionRequise, roleRequis, type AppEnv } from '../droits';
import { resolveUser } from '../identite';
import { validerActualite, validerPhoto } from '../validation';

export const actualites = new Hono<AppEnv>();

const COLONNES = `a.id, a.titre, a.texte, a.visibilite, a.statut, a.publiee_le, a.updated_at,
  EXISTS (SELECT 1 FROM actualites_images i WHERE i.actualite_id = a.id) AS image`;

type Ligne = { id: number; titre: string; texte: string; visibilite: string; statut: string; publiee_le: string | null; updated_at: string; image: number };

const versActualite = (l: Ligne) => ({ ...l, image: l.image === 1 });

const connecte = async (c: Context<AppEnv>) => (await resolveUser(c.req.raw, c.env)).statut === 'ok';

// Publiées, les plus récentes d'abord ; les « familles » seulement pour un compte connecté.
actualites.get('/', async (c) => {
  const limite = Math.min(Math.max(Number(c.req.query('limite')) || 30, 1), 100);
  const { results } = await c.env.DB.prepare(
    `SELECT ${COLONNES} FROM actualites a
     WHERE a.statut = 'publiee' AND (a.visibilite = 'public' OR ?1 = 1)
     ORDER BY a.publiee_le DESC, a.id DESC LIMIT ?2`,
  )
    .bind((await connecte(c)) ? 1 : 0, limite)
    .all<Ligne>();
  return c.json(results.map(versActualite));
});

/** Actualité publiée et visible par ce visiteur, ou la réponse d'erreur. */
async function actualiteVisible(c: Context<AppEnv>) {
  const l = await c.env.DB.prepare(`SELECT ${COLONNES} FROM actualites a WHERE a.id = ? AND a.statut = 'publiee'`)
    .bind(Number(c.req.param('id')) || 0)
    .first<Ligne>();
  if (!l) return { erreur: c.json({ error: 'Actualité introuvable' }, 404) };
  if (l.visibilite === 'familles' && !(await connecte(c))) {
    return { erreur: c.json({ error: 'Actualité réservée aux familles du club : connectez-vous.' }, 401) };
  }
  return { actualite: versActualite(l) };
}

actualites.get('/:id{[0-9]+}', async (c) => {
  const r = await actualiteVisible(c);
  return 'erreur' in r ? r.erreur : c.json(r.actualite);
});

async function reponseImage(c: Context<AppEnv>, id: number, publique: boolean) {
  const [entete, morceaux] = await c.env.DB.batch([
    c.env.DB.prepare('SELECT type FROM actualites_images WHERE actualite_id = ?').bind(id),
    c.env.DB.prepare('SELECT donnees FROM actualites_images_morceaux WHERE actualite_id = ? ORDER BY rang').bind(id),
  ]);
  const img = entete?.results[0] as { type: string } | undefined;
  const donnees = ((morceaux?.results ?? []) as { donnees: string }[]).map((m) => m.donnees).join('');
  if (!img || !donnees) return c.json({ error: 'Pas de photo' }, 404);
  const octets = Uint8Array.from(atob(donnees), (car) => car.charCodeAt(0));
  return c.body(octets, 200, {
    'Content-Type': img.type,
    // Photo publique : mise en cache ; réservée aux familles : jamais.
    'Cache-Control': publique ? 'public, max-age=3600' : 'private, no-store',
    'X-Content-Type-Options': 'nosniff',
  });
}

actualites.get('/:id{[0-9]+}/image', async (c) => {
  const r = await actualiteVisible(c);
  return 'erreur' in r ? r.erreur : reponseImage(c, r.actualite.id, r.actualite.visibilite === 'public');
});

// --- Gestion : bureau, gestion du site, admin ---

const gestion = new Hono<AppEnv>();
gestion.use('*', connexionRequise, roleRequis('bureau', 'contenu', 'admin'));

const AUTEUR = "(SELECT u.prenom || ' ' || u.nom FROM users u WHERE u.id = a.auteur) AS auteur";

gestion.get('/', async (c) => {
  const { results } = await c.env.DB.prepare(`SELECT ${COLONNES}, ${AUTEUR} FROM actualites a ORDER BY COALESCE(a.publiee_le, a.created_at) DESC, a.id DESC`).all<
    Ligne & { auteur: string | null }
  >();
  return c.json(results.map((l) => ({ ...versActualite(l), auteur: l.auteur })));
});

gestion.get('/:id{[0-9]+}', async (c) => {
  const l = await c.env.DB.prepare(`SELECT ${COLONNES}, ${AUTEUR} FROM actualites a WHERE a.id = ?`)
    .bind(Number(c.req.param('id')) || 0)
    .first<Ligne & { auteur: string | null }>();
  return l ? c.json({ ...versActualite(l), auteur: l.auteur }) : c.json({ error: 'Actualité introuvable' }, 404);
});

gestion.get('/:id{[0-9]+}/image', async (c) => reponseImage(c, Number(c.req.param('id')) || 0, false));

const corps = async (c: Context<AppEnv>) => (await c.req.json().catch(() => ({}))) as Record<string, unknown>;

gestion.post('/', async (c) => {
  const r = validerActualite(await corps(c));
  if (!r.ok) return c.json({ error: 'Saisie invalide', erreurs: r.erreurs }, 400);
  const a = r.valeur;
  const cree = await c.env.DB.prepare(
    `INSERT INTO actualites (titre, texte, visibilite, statut, publiee_le, auteur)
     VALUES (?1, ?2, ?3, ?4, CASE WHEN ?4 = 'publiee' THEN datetime('now') END, ?5) RETURNING id`,
  )
    .bind(a.titre, a.texte, a.visibilite, a.statut, c.get('utilisateur').id)
    .first<{ id: number }>();
  return c.json({ id: cree?.id }, 201);
});

gestion.put('/:id{[0-9]+}', async (c) => {
  const r = validerActualite(await corps(c));
  if (!r.ok) return c.json({ error: 'Saisie invalide', erreurs: r.erreurs }, 400);
  const a = r.valeur;
  // Date de publication : la première ; conservée si l'actualité repasse en brouillon puis revient.
  const res = await c.env.DB.prepare(
    `UPDATE actualites SET titre = ?1, texte = ?2, visibilite = ?3, statut = ?4,
       publiee_le = CASE WHEN ?4 = 'publiee' THEN COALESCE(publiee_le, datetime('now')) ELSE publiee_le END,
       updated_at = datetime('now')
     WHERE id = ?5`,
  )
    .bind(a.titre, a.texte, a.visibilite, a.statut, Number(c.req.param('id')) || 0)
    .run();
  return res.meta.changes ? c.json({ ok: true }) : c.json({ error: 'Actualité introuvable' }, 404);
});

/** Instructions qui effacent la photo d'une actualité (morceaux, puis en-tête). */
const effacerImage = (c: Context<AppEnv>, id: number) => [
  c.env.DB.prepare('DELETE FROM actualites_images_morceaux WHERE actualite_id = ?').bind(id),
  c.env.DB.prepare('DELETE FROM actualites_images WHERE actualite_id = ?').bind(id),
];

// La photo change : nouvelle date de modification, pour que l'ancienne ne reste pas en cache.
const toucher = (c: Context<AppEnv>, id: number) => c.env.DB.prepare("UPDATE actualites SET updated_at = datetime('now') WHERE id = ?").bind(id);

gestion.delete('/:id{[0-9]+}', async (c) => {
  const id = Number(c.req.param('id')) || 0;
  const [, , res] = await c.env.DB.batch([...effacerImage(c, id), c.env.DB.prepare('DELETE FROM actualites WHERE id = ?').bind(id)]);
  return res?.meta.changes ? c.json({ ok: true }) : c.json({ error: 'Actualité introuvable' }, 404);
});

// Photo : { image, type, accord: true } — l'accord droit à l'image des enfants reconnaissables est obligatoire.
gestion.put('/:id{[0-9]+}/image', async (c) => {
  const b = await corps(c);
  if (b.accord !== true) return c.json({ error: 'Confirmez l’accord droit à l’image des enfants reconnaissables', erreurs: { accord: 'Obligatoire' } }, 400);
  const r = validerPhoto(b, TAILLE_MAX_IMAGE_ACTUALITE);
  if (!r.ok) return c.json({ error: r.erreurs.image ?? 'Photo invalide', erreurs: r.erreurs }, 400);
  const id = Number(c.req.param('id')) || 0;
  const existe = await c.env.DB.prepare('SELECT 1 FROM actualites WHERE id = ?').bind(id).first();
  if (!existe) return c.json({ error: 'Actualité introuvable' }, 404);
  const morceaux: string[] = [];
  for (let i = 0; i < r.valeur.image.length; i += TAILLE_MORCEAU_IMAGE) morceaux.push(r.valeur.image.slice(i, i + TAILLE_MORCEAU_IMAGE));
  await c.env.DB.batch([
    ...effacerImage(c, id),
    c.env.DB.prepare('INSERT INTO actualites_images (actualite_id, type, accord, deposee_par) VALUES (?, ?, 1, ?)').bind(id, r.valeur.type, c.get('utilisateur').id),
    ...morceaux.map((m, rang) => c.env.DB.prepare('INSERT INTO actualites_images_morceaux (actualite_id, rang, donnees) VALUES (?, ?, ?)').bind(id, rang, m)),
    toucher(c, id),
  ]);
  return c.json({ ok: true });
});

gestion.delete('/:id{[0-9]+}/image', async (c) => {
  const id = Number(c.req.param('id')) || 0;
  await c.env.DB.batch([...effacerImage(c, id), toucher(c, id)]);
  return c.json({ ok: true });
});

actualites.route('/gestion', gestion);
