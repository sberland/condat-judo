// Liste du mercredi de l'encadrant (spec 012b) — monté sous /api/encadrant (rôles encadrant,
// bureau, admin). Photos et contacts des enfants à récupérer : seulement le mercredi même en
// production ; ailleurs (local, qualif), un mercredi peut être choisi pour les essais.
// Chaque consultation de la liste est inscrite au journal des accès (une fois par personne et par jour).
// Pointage (spec 012c) : récupéré ou absent à la garderie, puis parti avec une personne autorisée.
import { Hono, type Context } from 'hono';
import { categorieDe } from '../../../web/src/content/categories';
import { estMercredi, etatPointage, LIENS_RESPONSABLE, maintenantParis, mercredisOuverts, type Pointage } from '../../../web/src/content/garderie';
import { connexionRequise, roleRequis, type AppEnv } from '../droits';
import { lirePhoto, PHOTO_RECENTE, reponsePhoto } from '../photos';
import { saisonCourante } from '../saison';

export const encadrant = new Hono<AppEnv>();
encadrant.use('*', connexionRequise, roleRequis('encadrant', 'bureau', 'admin'));

const essais = (c: Context<AppEnv>) => c.env.ENVIRONMENT !== 'production';

/** Jour consultable : aujourd'hui (heure de Paris) ; hors production, le mercredi demandé. */
function jourConsultable(c: Context<AppEnv>, demande: string | undefined): string {
  if (essais(c) && demande && estMercredi(demande)) return demande;
  return maintenantParis().slice(0, 10);
}

type LigneEnfant = { id: number; prenom: string; nom: string; date_naissance: string; lieu: string; photo: number } & Pointage;
type LigneResponsable = { adherent_id: number; user_id: number; prenom: string; nom: string; telephone: string | null; qualite: string; peut_recuperer: number; est_contact: number };
type LignePersonne = { adherent_id: number; id: number; prenom: string; nom: string; lien: string; telephone: string | null };

encadrant.get('/garderie', async (c) => {
  const saison = await saisonCourante(c);
  const g = saison.referentiel.garderie;
  const aujourdhui = maintenantParis().slice(0, 10);
  const date = jourConsultable(c, c.req.query('date'));
  const ouverts = mercredisOuverts(g);
  const reponse = {
    date,
    aujourdhui,
    essais: essais(c),
    // Hors production : les mercredis proposés pour les essais.
    mercredis: essais(c) ? ouverts.filter((m) => m >= aujourdhui).slice(0, 8) : [],
    prochain: ouverts.find((m) => m > aujourdhui) ?? null,
    lieux: g.lieux,
  };
  if (!estMercredi(date)) return c.json({ ...reponse, enfants: null });

  const DEMANDES = 'SELECT adherent_id FROM garderie_demandes WHERE date = ?1';
  const [enfants, responsables, personnes] = await c.env.DB.batch([
    c.env.DB.prepare(
      `SELECT a.id, a.prenom, a.nom, a.date_naissance, d.lieu, d.recupere_le, d.absent_le, d.parti_le, d.parti_avec,
              (p.adherent_id IS NOT NULL AND dd.photo_garderie = 'oui') AS photo
       FROM garderie_demandes d JOIN adherents a ON a.id = d.adherent_id AND a.supprime_le IS NULL
       LEFT JOIN photos_adherents p ON p.adherent_id = a.id AND ${PHOTO_RECENTE}
       LEFT JOIN adhesions dd ON dd.adherent_id = a.id AND dd.saison = ?2
       WHERE d.date = ?1 ORDER BY d.lieu, a.prenom, a.nom`,
    ).bind(date, saison.id),
    c.env.DB.prepare(
      `SELECT l.adherent_id, u.id AS user_id, u.prenom, u.nom, u.telephone, l.qualite, l.peut_recuperer, l.est_contact
       FROM liens l JOIN users u ON u.id = l.user_id AND u.supprime_le IS NULL
       WHERE l.adherent_id IN (${DEMANDES}) ORDER BY l.peut_recuperer DESC, u.nom, u.prenom`,
    ).bind(date),
    c.env.DB.prepare(`SELECT adherent_id, id, prenom, nom, lien, telephone FROM personnes_autorisees WHERE adherent_id IN (${DEMANDES}) ORDER BY nom, prenom`).bind(
      date,
    ),
  ]);
  const liste = (enfants?.results ?? []) as LigneEnfant[];
  const rs = (responsables?.results ?? []) as LigneResponsable[];
  const ps = (personnes?.results ?? []) as LignePersonne[];

  if (liste.length) {
    const detail = `garderie du ${date} : photos et contacts`;
    await c.env.DB.prepare(
      `INSERT INTO journal_acces (user_id, action, cible, cible_id, detail)
       SELECT ?1, 'consultation', 'adherent', NULL, ?2
       WHERE NOT EXISTS (SELECT 1 FROM journal_acces WHERE user_id = ?1 AND detail = ?2 AND cree_le >= date('now'))`,
    )
      .bind(c.get('utilisateur').id, detail)
      .run();
  }

  const categories = saison.referentiel.categories;
  return c.json({
    ...reponse,
    enfants: liste.map((e) => ({
      id: e.id,
      prenom: e.prenom,
      nom: e.nom,
      categorie: categorieDe(categories, e.date_naissance)?.nom ?? null,
      lieu: e.lieu,
      photo: e.photo === 1,
      pointage: { etat: etatPointage(e), recupere_le: e.recupere_le, absent_le: e.absent_le, parti_le: e.parti_le, parti_avec: e.parti_avec },
      responsables: rs
        .filter((r) => r.adherent_id === e.id)
        .map((r) => ({ id: r.user_id, prenom: r.prenom, nom: r.nom, qualite: r.qualite, telephone: r.telephone, peutRecuperer: r.peut_recuperer === 1, estContact: r.est_contact === 1 })),
      personnes: ps.filter((p) => p.adherent_id === e.id).map(({ id, prenom, nom, lien, telephone }) => ({ id, prenom, nom, lien, telephone })),
    })),
  });
});

// Photo d'un enfant de la liste : le jour consultable, s'il est demandé ce jour-là et avec l'accord de la saison.
encadrant.get('/garderie/:date/photo/:adherentId', async (c) => {
  const date = c.req.param('date');
  const adherentId = Number(c.req.param('adherentId')) || 0;
  if (date !== jourConsultable(c, date)) return c.json({ error: 'Pas de photo' }, 404);
  const demande = await c.env.DB.prepare(
    `SELECT 1 FROM garderie_demandes d
     JOIN adhesions dd ON dd.adherent_id = d.adherent_id AND dd.saison = ? AND dd.photo_garderie = 'oui'
     WHERE d.date = ? AND d.adherent_id = ?`,
  )
    .bind((await saisonCourante(c)).id, date, adherentId)
    .first();
  if (!demande) return c.json({ error: 'Pas de photo' }, 404);
  return reponsePhoto(c, await lirePhoto(c.env, adherentId));
});

// --- Pointage (spec 012c) ---

/** Nom recopié de la personne avec qui l'enfant part, si elle est autorisée pour cet enfant ; sinon null. */
async function personneAutorisee(c: Context<AppEnv>, adherentId: number, avec: unknown): Promise<string | null> {
  const a = (avec ?? {}) as { type?: unknown; id?: unknown };
  const id = Number(a.id);
  if (!Number.isInteger(id) || id <= 0) return null;
  if (a.type === 'responsable') {
    const r = await c.env.DB.prepare(
      `SELECT u.prenom, u.nom, l.qualite FROM liens l JOIN users u ON u.id = l.user_id AND u.supprime_le IS NULL
       WHERE l.adherent_id = ? AND l.user_id = ? AND l.peut_recuperer = 1`,
    )
      .bind(adherentId, id)
      .first<{ prenom: string; nom: string; qualite: string }>();
    return r ? `${r.prenom} ${r.nom} (${LIENS_RESPONSABLE[r.qualite] ?? 'responsable'})` : null;
  }
  if (a.type === 'personne') {
    const p = await c.env.DB.prepare('SELECT prenom, nom, lien FROM personnes_autorisees WHERE adherent_id = ? AND id = ?')
      .bind(adherentId, id)
      .first<{ prenom: string; nom: string; lien: string }>();
    return p ? `${p.prenom} ${p.nom} (${p.lien})` : null;
  }
  return null;
}

// { etape: 'recupere' | 'absent' | 'parti' (avec { type, id }) | 'annuler' } — le jour consultable seulement.
encadrant.put('/garderie/:date/:adherentId/pointage', async (c) => {
  const date = c.req.param('date');
  if (!estMercredi(date) || date !== jourConsultable(c, date)) return c.json({ error: 'Pointage possible le mercredi même seulement' }, 409);
  const adherentId = Number(c.req.param('adherentId')) || 0;
  const d = await c.env.DB.prepare('SELECT recupere_le, absent_le, parti_le, parti_avec FROM garderie_demandes WHERE adherent_id = ? AND date = ?')
    .bind(adherentId, date)
    .first<Pointage>();
  if (!d) return c.json({ error: 'Pas de demande pour cet enfant ce mercredi' }, 404);
  const corps = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const etat = etatPointage(d);
  const moi = c.get('utilisateur').id;
  const maj = (sql: string, ...params: (string | number)[]) =>
    c.env.DB.prepare(`UPDATE garderie_demandes SET ${sql} WHERE adherent_id = ? AND date = ?`).bind(...params, adherentId, date).run();

  switch (corps.etape) {
    case 'recupere':
    case 'absent':
      if (etat === 'parti') return c.json({ error: 'L’enfant est déjà parti : annulez d’abord le départ' }, 409);
      await (corps.etape === 'recupere'
        ? maj("recupere_le = datetime('now'), absent_le = NULL, pointe_par = ?", moi)
        : maj("absent_le = datetime('now'), recupere_le = NULL, pointe_par = ?", moi));
      break;
    case 'parti': {
      if (etat !== 'recupere') return c.json({ error: 'Pointez d’abord l’enfant « Récupéré »' }, 409);
      const avec = await personneAutorisee(c, adherentId, corps.avec);
      if (!avec) return c.json({ error: 'Cette personne n’est pas autorisée à récupérer l’enfant : appelez un responsable' }, 403);
      await maj("parti_le = datetime('now'), parti_avec = ?, parti_par = ?", avec, moi);
      break;
    }
    case 'annuler':
      // Annule la dernière étape : le départ, sinon « récupéré » ou « absent ».
      await (etat === 'parti'
        ? maj('parti_le = NULL, parti_avec = NULL, parti_par = NULL')
        : maj('recupere_le = NULL, absent_le = NULL, pointe_par = NULL'));
      break;
    default:
      return c.json({ error: 'Étape inconnue' }, 400);
  }
  return c.json({ ok: true });
});
