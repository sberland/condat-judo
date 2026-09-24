// Trésorerie (spec 011) — suivi des cotisations, réservé aux rôles `tresorier` et `admin`
// (minimisation : le rôle « bureau » seul ne voit pas les paiements). Les familles voient leurs
// propres paiements via /api/famille/paiements, sans les références des chèques.
import { Hono, type Context } from 'hono';
import { SAISON } from '../../../web/src/content/adhesion';
import { cumul, ECHEANCES_3_FOIS, ENCAISSES_A_RECEPTION, exigible, situation } from '../../../web/src/content/paiements';
import { connexionRequise, roleRequis, type AppEnv } from '../droits';
import { regrouperFamilles } from '../familles';
import { validerPaiement, type PaiementSaisi } from '../validation';
import { aujourdhuiParis } from './competitions';

export const tresorerie = new Hono<AppEnv>();
tresorerie.use('*', connexionRequise, roleRequis('tresorier', 'admin'));

type LigneDossier = {
  adhesion_id: number;
  adherent_id: number;
  prenom: string;
  nom: string;
  formule: string;
  montant_total: number;
  paiement_3_fois: number;
  echeance_1: number;
  echeance_2: number;
  echeance_3: number;
  paiement_mode: string | null;
  paye: number;
};

type LigneCompte = { adherent_id: number; user_id: number; prenom: string; nom: string; telephone: string | null };

type LignePaiement = {
  id: number;
  montant: number;
  mode: string;
  reference: string | null;
  recu_le: string;
  encaisser_le: string | null;
  encaisse_le: string | null;
};

type Part = { paiement_id: number; adhesion_id: number; prenom: string; nom: string; montant: number };

const id = (c: Context<AppEnv>, nom: string) => Number(c.req.param(nom)) || 0;

/** Dossiers de la saison, regroupés en familles, avec la situation de chacune. */
async function chargerFamilles(c: Context<AppEnv>) {
  const [dossiersR, comptesR] = await c.env.DB.batch([
    c.env.DB.prepare(
      `SELECT d.id AS adhesion_id, d.adherent_id, a.prenom, a.nom, d.formule, d.montant_total, d.paiement_3_fois,
              d.echeance_1, d.echeance_2, d.echeance_3, d.paiement_mode,
              COALESCE((SELECT sum(p.montant) FROM paiement_parts p WHERE p.adhesion_id = d.id), 0) AS paye
       FROM adhesions d JOIN adherents a ON a.id = d.adherent_id
       WHERE d.saison = ? ORDER BY a.nom, a.prenom`,
    ).bind(SAISON.id),
    // Arêtes de famille : responsables légaux, et compte de l'adhérent majeur lui-même.
    c.env.DB.prepare(
      `SELECT l.adherent_id, u.id AS user_id, u.prenom, u.nom, u.telephone
       FROM liens l JOIN users u ON u.id = l.user_id AND u.supprime_le IS NULL
       WHERE l.adherent_id IN (SELECT adherent_id FROM adhesions WHERE saison = ?1)
       UNION ALL
       SELECT a.id, u.id, u.prenom, u.nom, u.telephone
       FROM adherents a JOIN users u ON u.id = a.user_id AND u.supprime_le IS NULL
       WHERE a.id IN (SELECT adherent_id FROM adhesions WHERE saison = ?1)`,
    ).bind(SAISON.id),
  ]);
  const dossiers = (dossiersR?.results ?? []) as LigneDossier[];
  const comptes = (comptesR?.results ?? []) as LigneCompte[];
  const jour = aujourdhuiParis();

  const familles = regrouperFamilles(
    dossiers.map((d) => d.adherent_id),
    comptes.map(({ adherent_id, user_id }) => ({ adherent_id, user_id })),
  ).map((ids) => {
    const ds = dossiers.filter((d) => ids.includes(d.adherent_id));
    const responsables = [...new Map(comptes.filter((r) => ids.includes(r.adherent_id)).map((r) => [r.user_id, r])).values()];
    const avecSituation = ds.map((d) => ({ ...d, ...situation(d.montant_total, d.paye, exigible(d, jour)) }));
    return {
      id: Math.min(...ds.map((d) => d.adhesion_id)),
      libelle: [...new Set(ds.map((d) => d.nom))].join(' / '),
      membres: ds.map((d) => ({ adhesion_id: d.adhesion_id, prenom: d.prenom, nom: d.nom })),
      responsables: responsables.map(({ user_id, prenom, nom, telephone }) => ({ id: user_id, prenom, nom, telephone })),
      dossiers: avecSituation,
      ...cumul(avecSituation),
    };
  });
  return { dossiers, familles, jour };
}

/** Paiements de la saison (filtre SQL facultatif), chacun avec sa répartition par enfant. */
async function chargerPaiements(c: Context<AppEnv>, filtre = '', ...params: (string | number)[]) {
  const [paiementsR, partsR] = await c.env.DB.batch([
    c.env.DB.prepare(
      `SELECT id, montant, mode, reference, recu_le, encaisser_le, encaisse_le FROM paiements p
       WHERE saison = ? ${filtre} ORDER BY recu_le, id`,
    ).bind(SAISON.id, ...params),
    c.env.DB.prepare(
      `SELECT pp.paiement_id, pp.adhesion_id, a.prenom, a.nom, pp.montant
       FROM paiement_parts pp JOIN paiements p ON p.id = pp.paiement_id
       JOIN adhesions d ON d.id = pp.adhesion_id JOIN adherents a ON a.id = d.adherent_id
       WHERE p.saison = ? ${filtre} ORDER BY a.prenom`,
    ).bind(SAISON.id, ...params),
  ]);
  const parts = (partsR?.results ?? []) as Part[];
  return ((paiementsR?.results ?? []) as LignePaiement[]).map((p) => ({
    ...p,
    parts: parts.filter((x) => x.paiement_id === p.id).map(({ adhesion_id, prenom, nom, montant }) => ({ adhesion_id, prenom, nom, montant })),
  }));
}

// Tableau de bord : totaux de la saison, paiements à remettre en banque ce mois-ci, familles.
tresorerie.get('/', async (c) => {
  const { familles, jour } = await chargerFamilles(c);
  const aRemettre = await chargerPaiements(c, `AND encaisse_le IS NULL AND (encaisser_le IS NULL OR encaisser_le <= ?)`, `${jour.slice(0, 7)}-31`);
  return c.json({
    saison: SAISON,
    echeances: ECHEANCES_3_FOIS,
    totaux: cumul(familles),
    aRemettre,
    familles: familles.map(({ dossiers: _, responsables: __, ...f }) => f),
  });
});

// Fiche d'une famille, désignée par l'un de ses dossiers.
tresorerie.get('/familles/:id', async (c) => {
  const { familles } = await chargerFamilles(c);
  const famille = familles.find((f) => f.membres.some((m) => m.adhesion_id === id(c, 'id')));
  if (!famille) return c.json({ error: 'Famille introuvable' }, 404);
  const ids = famille.membres.map((m) => m.adhesion_id);
  const paiements = await chargerPaiements(
    c,
    `AND p.id IN (SELECT paiement_id FROM paiement_parts WHERE adhesion_id IN (${ids.map(() => '?').join(', ')}))`,
    ...ids,
  );
  return c.json({ saison: SAISON, echeances: ECHEANCES_3_FOIS, famille, paiements });
});

// Tous les paiements de la saison (export pour la comptabilité).
tresorerie.get('/paiements', async (c) => c.json(await chargerPaiements(c)));

// Un ou plusieurs paiements (ex. les 3 chèques d'un paiement en 3 fois), enregistrés ensemble.
tresorerie.post('/paiements', async (c) => {
  let corps: unknown;
  try {
    corps = await c.req.json();
  } catch {
    corps = null;
  }
  const liste = corps && typeof corps === 'object' && Array.isArray((corps as { paiements?: unknown }).paiements) ? (corps as { paiements: unknown[] }).paiements : [];
  if (!liste.length || liste.length > 12) return c.json({ error: 'Saisie invalide', erreurs: { montant: 'Aucun paiement à enregistrer' } }, 400);
  const valides: PaiementSaisi[] = [];
  for (const p of liste) {
    const r = validerPaiement((p ?? {}) as Record<string, unknown>);
    if (!r.ok) return c.json({ error: 'Saisie invalide', erreurs: r.erreurs }, 400);
    valides.push(r.valeur);
  }
  const dossiers = [...new Set(valides.flatMap((p) => p.parts.map((x) => x.adhesion_id)))];
  const connus = await c.env.DB.prepare(`SELECT count(*) AS n FROM adhesions WHERE saison = ? AND id IN (${dossiers.map(() => '?').join(', ')})`)
    .bind(SAISON.id, ...dossiers)
    .first<{ n: number }>();
  if (connus?.n !== dossiers.length) return c.json({ error: 'Dossier introuvable pour cette saison' }, 404);

  const moi = c.get('utilisateur').id;
  const instructions = valides.flatMap((p) => [
    c.env.DB.prepare(
      `INSERT INTO paiements (saison, montant, mode, reference, recu_le, encaisser_le, encaisse_le, saisi_par) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ).bind(SAISON.id, p.montant, p.mode, p.reference, p.recu_le, p.encaisser_le, ENCAISSES_A_RECEPTION.includes(p.mode) ? p.recu_le : null, moi),
    // Le lot est une transaction : le dernier paiement inséré est celui de la ligne précédente.
    ...p.parts.map((x) =>
      c.env.DB.prepare('INSERT INTO paiement_parts (paiement_id, adhesion_id, montant) VALUES ((SELECT max(id) FROM paiements), ?, ?)').bind(
        x.adhesion_id,
        x.montant,
      ),
    ),
  ]);
  await c.env.DB.batch(instructions);
  return c.json({ ok: true }, 201);
});

// Remise en banque (ou annulation de la remise).
tresorerie.put('/paiements/:id/encaisse', async (c) => {
  const corps = (await c.req.json().catch(() => ({}))) as { encaisse_le?: unknown };
  const date = corps.encaisse_le ?? null;
  if (date !== null && (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date))) return c.json({ error: 'Date invalide' }, 400);
  const res = await c.env.DB.prepare("UPDATE paiements SET encaisse_le = ?, updated_at = datetime('now') WHERE id = ? AND saison = ?")
    .bind(date, id(c, 'id'), SAISON.id)
    .run();
  if (!res.meta.changes) return c.json({ error: 'Paiement introuvable' }, 404);
  return c.json({ ok: true });
});

tresorerie.delete('/paiements/:id', async (c) => {
  const res = await c.env.DB.prepare('DELETE FROM paiements WHERE id = ? AND saison = ?').bind(id(c, 'id'), SAISON.id).run();
  if (!res.meta.changes) return c.json({ error: 'Paiement introuvable' }, 404);
  return c.json({ ok: true });
});
