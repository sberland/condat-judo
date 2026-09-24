// Espace famille (spec 004) — tout compte connecté. Un responsable ne voit QUE les adhérents
// auxquels il est lié (filtre sur `liens.user_id` = lui-même, côté SQL). v1 : consultation, et mise
// à jour de son propre téléphone ; la modification des fiches enfants viendra avec la spec 010.
import { Hono, type Context } from 'hono';
import { categorieDe, eligible, type Categorie } from '../../../web/src/content/categories';
import { exigible, situation } from '../../../web/src/content/paiements';
import { libelleLimite, maintenantParis, mercredisOuverts, modifiable, type ReglagesGarderie } from '../../../web/src/content/garderie';
import { connexionRequise, type AppEnv } from '../droits';
import { aujourdhuiParis, COLONNES_COMPETITION, inscriptionsOuvertes, lireCompetition, versCompetition } from './competitions';
import { donneesDuCompte } from '../export';
import { saisonCourante, saisonPourDate } from '../saison';
import { validerTelephoneSeul } from '../validation';

export const famille = new Hono<AppEnv>();
famille.use('*', connexionRequise);

type Enfant = {
  id: number;
  prenom: string;
  nom: string;
  date_naissance: string;
  sexe: string;
  grade: string | null;
  numero_licence: string | null;
  qualite: string;
  peut_inscrire: number;
  peut_recuperer: number;
  est_contact: number;
};

famille.get('/enfants', async (c) => {
  const moi = c.get('utilisateur').id;
  const { results: enfants } = await c.env.DB.prepare(
    `SELECT a.id, a.prenom, a.nom, a.date_naissance, a.sexe, a.grade, a.numero_licence,
            l.qualite, l.peut_inscrire, l.peut_recuperer, l.est_contact
     FROM liens l JOIN adherents a ON a.id = l.adherent_id
     WHERE l.user_id = ? AND a.supprime_le IS NULL
     ORDER BY a.date_naissance DESC`,
  )
    .bind(moi)
    .all<Enfant>();
  if (!enfants.length) return c.json([]);

  // Co-responsables, personnes autorisées et compétitions des seuls enfants de ce responsable.
  const [coResponsables, personnes, competitions] = await c.env.DB.batch([
    c.env.DB.prepare(
      `SELECT l.adherent_id, u.prenom, u.nom, l.qualite
       FROM liens l JOIN users u ON u.id = l.user_id
       WHERE u.supprime_le IS NULL AND u.id != ?1
         AND l.adherent_id IN (SELECT adherent_id FROM liens WHERE user_id = ?1)`,
    ).bind(moi),
    c.env.DB.prepare(
      `SELECT adherent_id, prenom, nom, lien FROM personnes_autorisees
       WHERE adherent_id IN (SELECT adherent_id FROM liens WHERE user_id = ?)`,
    ).bind(moi),
    c.env.DB.prepare(
      `SELECT i.adherent_id, co.id, co.nom, co.date, co.statut FROM inscriptions_competition i
       JOIN competitions co ON co.id = i.competition_id
       WHERE i.adherent_id IN (SELECT adherent_id FROM liens WHERE user_id = ?)
       ORDER BY co.date DESC`,
    ).bind(moi),
  ]);
  type Co = { adherent_id: number; prenom: string; nom: string; qualite: string };
  type Pa = { adherent_id: number; prenom: string; nom: string; lien: string };
  type Ic = { adherent_id: number; id: number; nom: string; date: string; statut: string };
  const co = (coResponsables?.results ?? []) as Co[];
  const pa = (personnes?.results ?? []) as Pa[];
  const ic = (competitions?.results ?? []) as Ic[];

  return c.json(
    enfants.map((e) => ({
      ...e,
      coResponsables: co.filter((r) => r.adherent_id === e.id).map(({ prenom, nom, qualite }) => ({ prenom, nom, qualite })),
      personnesAutorisees: pa.filter((p) => p.adherent_id === e.id).map(({ prenom, nom, lien }) => ({ prenom, nom, lien })),
      competitions: ic.filter((i) => i.adherent_id === e.id).map(({ id, nom, date, statut }) => ({ id, nom, date, statut })),
    })),
  );
});

// --- Compétitions (spec 009) : un responsable inscrit SES enfants, s'il en a le droit ---

type EnfantCompetition = {
  id: number;
  prenom: string;
  nom: string;
  date_naissance: string;
  sexe: 'F' | 'M';
  peut_inscrire: number;
  inscrit: number;
};

/** Mes enfants face à une compétition : catégorie, éligibilité, droit d'inscrire, inscription. */
famille.get('/competitions/:id', async (c) => {
  const comp = await lireCompetition(c, Number(c.req.param('id')) || 0);
  if (!comp) return c.json({ error: 'Compétition introuvable' }, 404);
  const { results } = await c.env.DB.prepare(
    `SELECT a.id, a.prenom, a.nom, a.date_naissance, a.sexe, l.peut_inscrire,
            EXISTS (SELECT 1 FROM inscriptions_competition i WHERE i.competition_id = ?1 AND i.adherent_id = a.id) AS inscrit
     FROM liens l JOIN adherents a ON a.id = l.adherent_id
     WHERE l.user_id = ?2 AND a.supprime_le IS NULL
     ORDER BY a.date_naissance DESC`,
  )
    .bind(comp.id, c.get('utilisateur').id)
    .all<EnfantCompetition>();
  const cats = (await saisonPourDate(c, comp.date)).referentiel.categories;
  return c.json({
    inscriptionsOuvertes: inscriptionsOuvertes(comp),
    enfants: results.map((e) => ({
      id: e.id,
      prenom: e.prenom,
      nom: e.nom,
      categorie: categorieDe(cats, e.date_naissance)?.nom ?? null,
      eligible: eligible(cats, e, comp),
      peutInscrire: e.peut_inscrire === 1,
      inscrit: e.inscrit === 1,
    })),
  });
});

/** Pour chaque compétition à venir : mes enfants concernés (éligibles ou déjà inscrits). */
famille.get('/competitions', async (c) => {
  const moi = c.get('utilisateur').id;
  const [comps, enfants, inscriptions] = await c.env.DB.batch([
    c.env.DB.prepare(`SELECT ${COLONNES_COMPETITION} FROM competitions WHERE date >= ?`).bind(aujourdhuiParis()),
    c.env.DB.prepare(
      `SELECT a.id, a.prenom, a.date_naissance, a.sexe FROM liens l JOIN adherents a ON a.id = l.adherent_id
       WHERE l.user_id = ? AND a.supprime_le IS NULL ORDER BY a.date_naissance DESC`,
    ).bind(moi),
    c.env.DB.prepare(
      `SELECT i.competition_id, i.adherent_id FROM inscriptions_competition i
       JOIN liens l ON l.adherent_id = i.adherent_id AND l.user_id = ?`,
    ).bind(moi),
  ]);
  type E = { id: number; prenom: string; date_naissance: string; sexe: 'F' | 'M' };
  const mesEnfants = (enfants?.results ?? []) as E[];
  const inscrits = new Set(((inscriptions?.results ?? []) as { competition_id: number; adherent_id: number }[]).map((i) => `${i.competition_id}-${i.adherent_id}`));
  const liste = ((comps?.results ?? []) as Parameters<typeof versCompetition>[0][]).map(versCompetition);
  const categories = new Map<number, Categorie[]>();
  for (const comp of liste) categories.set(comp.id, (await saisonPourDate(c, comp.date)).referentiel.categories);
  return c.json(
    liste.map((comp) => ({
      competition_id: comp.id,
      enfants: mesEnfants
        .map((e) => ({ prenom: e.prenom, inscrit: inscrits.has(`${comp.id}-${e.id}`), eligible: eligible(categories.get(comp.id) ?? [], e, comp) }))
        .filter((e) => e.inscrit || e.eligible)
        .map(({ prenom, inscrit }) => ({ prenom, inscrit })),
    })),
  );
});

async function controleInscription(c: Context<AppEnv>) {
  const comp = await lireCompetition(c, Number(c.req.param('id')) || 0);
  if (!comp) return { erreur: c.json({ error: 'Compétition introuvable' }, 404) };
  if (!inscriptionsOuvertes(comp)) return { erreur: c.json({ error: 'Les inscriptions sont closes pour cette compétition' }, 409) };
  const adherentId = Number(c.req.param('adherentId')) || 0;
  const enfant = await c.env.DB.prepare(
    `SELECT a.date_naissance, a.sexe, l.peut_inscrire FROM liens l JOIN adherents a ON a.id = l.adherent_id
     WHERE l.user_id = ? AND l.adherent_id = ? AND a.supprime_le IS NULL`,
  )
    .bind(c.get('utilisateur').id, adherentId)
    .first<{ date_naissance: string; sexe: 'F' | 'M'; peut_inscrire: number }>();
  // Pas lié à cet enfant, ou lié sans le droit d'inscrire : même réponse (rien à révéler).
  if (!enfant || enfant.peut_inscrire !== 1) return { erreur: c.json({ error: 'Vous ne pouvez pas inscrire cet enfant' }, 403) };
  return { comp, adherentId, enfant };
}

famille.put('/competitions/:id/inscriptions/:adherentId', async (c) => {
  const r = await controleInscription(c);
  if ('erreur' in r) return r.erreur;
  if (!eligible((await saisonPourDate(c, r.comp.date)).referentiel.categories, r.enfant, r.comp)) return c.json({ error: 'Cet enfant n’est pas dans les catégories de la compétition' }, 409);
  await c.env.DB.prepare('INSERT OR IGNORE INTO inscriptions_competition (competition_id, adherent_id, inscrit_par) VALUES (?, ?, ?)')
    .bind(r.comp.id, r.adherentId, c.get('utilisateur').id)
    .run();
  return c.json({ ok: true });
});

famille.delete('/competitions/:id/inscriptions/:adherentId', async (c) => {
  const r = await controleInscription(c);
  if ('erreur' in r) return r.erreur;
  await c.env.DB.prepare('DELETE FROM inscriptions_competition WHERE competition_id = ? AND adherent_id = ?').bind(r.comp.id, r.adherentId).run();
  return c.json({ ok: true });
});

// --- Cotisations (spec 011) : ce que la famille doit et a payé, pour SES enfants (et elle-même) ---

type DossierFamille = {
  adhesion_id: number;
  prenom: string;
  nom: string;
  formule: string;
  montant_total: number;
  paiement_3_fois: number;
  echeance_1: number;
  echeance_2: number;
  echeance_3: number;
  paye: number;
};

famille.get('/paiements', async (c) => {
  const moi = c.get('utilisateur').id;
  const saison = await saisonCourante(c);
  const dates = saison.referentiel.echeances3Fois.dates;
  const { results: dossiers } = await c.env.DB.prepare(
    `SELECT d.id AS adhesion_id, a.prenom, a.nom, d.formule, d.montant_total, d.paiement_3_fois,
            d.echeance_1, d.echeance_2, d.echeance_3,
            COALESCE((SELECT sum(p.montant) FROM paiement_parts p WHERE p.adhesion_id = d.id), 0) AS paye
     FROM adhesions d JOIN adherents a ON a.id = d.adherent_id
     WHERE d.saison = ?1 AND (d.adherent_id IN (SELECT adherent_id FROM liens WHERE user_id = ?2) OR a.user_id = ?2)
     ORDER BY a.date_naissance DESC`,
  )
    .bind(saison.id, moi)
    .all<DossierFamille>();
  const ids = dossiers.map((d) => d.adhesion_id);
  // Versements : date, mode, montant de la part de chaque enfant — jamais la référence du chèque.
  const versements = ids.length
    ? (
        await c.env.DB.prepare(
          `SELECT pp.adhesion_id, pp.montant, p.mode, p.recu_le, p.encaisser_le, p.encaisse_le
           FROM paiement_parts pp JOIN paiements p ON p.id = pp.paiement_id
           WHERE pp.adhesion_id IN (${ids.map(() => '?').join(', ')}) ORDER BY p.recu_le, p.id`,
        )
          .bind(...ids)
          .all<{ adhesion_id: number; montant: number; mode: string; recu_le: string; encaisser_le: string | null; encaisse_le: string | null }>()
      ).results
    : [];
  const jour = aujourdhuiParis();
  return c.json({
    saison: { id: saison.id, libelle: saison.libelle },
    echeances: saison.referentiel.echeances3Fois,
    dossiers: dossiers.map((d) => ({
      ...d,
      ...situation(d.montant_total, d.paye, exigible(d, jour, dates)),
      versements: versements.filter((v) => v.adhesion_id === d.adhesion_id).map(({ adhesion_id: _, ...v }) => v),
    })),
  });
});

// --- Droits RGPD (spec 019) ---

// Toutes les données qui concernent ce compte et les adhérents qui lui sont liés.
famille.get('/export', async (c) => {
  const donnees = await donneesDuCompte(c.env, c.get('utilisateur').id);
  return donnees ? c.json(donnees) : c.json({ error: 'Compte introuvable' }, 404);
});

type Accords = {
  adhesion_id: number;
  prenom: string;
  qualite: string | null;
  droit_image: string;
  droit_image_le: string | null;
  whatsapp: string;
  whatsapp_le: string | null;
};

// Accords de la saison (droit à l'image, groupe WhatsApp) pour mes enfants — et moi, adhérent majeur.
// Répondent : les responsables légaux (mère, père, tuteur), ou l'adhérent majeur pour lui-même.
const ACCORDS = `SELECT d.id AS adhesion_id, a.prenom, l.qualite, d.droit_image, d.droit_image_le, d.whatsapp, d.whatsapp_le
  FROM adhesions d JOIN adherents a ON a.id = d.adherent_id AND a.supprime_le IS NULL
  LEFT JOIN liens l ON l.adherent_id = a.id AND l.user_id = ?2
  WHERE d.saison = ?1 AND (l.qualite IN ('mere', 'pere', 'tuteur') OR a.user_id = ?2)`;

famille.get('/accords', async (c) => {
  const saison = await saisonCourante(c);
  const { results } = await c.env.DB.prepare(`${ACCORDS} ORDER BY a.date_naissance DESC`).bind(saison.id, c.get('utilisateur').id).all<Accords>();
  return c.json({ saison: { id: saison.id, libelle: saison.libelle }, accords: results.map(({ qualite: _, ...a }) => a) });
});

famille.put('/accords/:adhesionId', async (c) => {
  const corps = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const champ = corps.accord;
  const valeur = corps.valeur;
  if ((champ !== 'droit_image' && champ !== 'whatsapp') || (valeur !== 'oui' && valeur !== 'non')) return c.json({ error: 'Saisie invalide' }, 400);
  const moi = c.get('utilisateur').id;
  const dossier = await c.env.DB.prepare(`${ACCORDS} AND d.id = ?3`).bind((await saisonCourante(c)).id, moi, Number(c.req.param('adhesionId')) || 0).first<Accords>();
  if (!dossier) return c.json({ error: 'Vous ne pouvez pas répondre pour cet adhérent' }, 403);
  // Colonnes choisies dans une liste fermée (jamais la saisie) : pas d'injection possible.
  await c.env.DB.prepare(`UPDATE adhesions SET ${champ} = ?, ${champ}_le = datetime('now'), ${champ}_par = ?, updated_at = datetime('now') WHERE id = ?`)
    .bind(valeur, moi, dossier.adhesion_id)
    .run();
  return c.json({ ok: true });
});

// --- Garderie du mercredi (spec 012a) : demandes du responsable pour SES enfants ---

/** Garderie ouverte aux demandes des familles : en production, pas tant que les réglages sont à confirmer. */
const garderieOuverte = (c: Context<AppEnv>, g: ReglagesGarderie) => !(g.provisoire && c.env.ENVIRONMENT === 'production');

famille.get('/garderie', async (c) => {
  const saison = await saisonCourante(c);
  const g = saison.referentiel.garderie;
  const maintenant = maintenantParis();
  const aujourdhui = maintenant.slice(0, 10);
  const moi = c.get('utilisateur').id;
  const { results: enfants } = await c.env.DB.prepare(
    `SELECT a.id, a.prenom, a.nom, l.peut_inscrire FROM liens l JOIN adherents a ON a.id = l.adherent_id
     WHERE l.user_id = ? AND a.supprime_le IS NULL ORDER BY a.date_naissance DESC`,
  )
    .bind(moi)
    .all<{ id: number; prenom: string; nom: string; peut_inscrire: number }>();
  const { results: demandes } = await c.env.DB.prepare(
    `SELECT d.adherent_id, d.date, d.lieu FROM garderie_demandes d JOIN liens l ON l.adherent_id = d.adherent_id AND l.user_id = ?
     WHERE d.date >= ? ORDER BY d.date`,
  )
    .bind(moi, aujourdhui)
    .all<{ adherent_id: number; date: string; lieu: string }>();
  return c.json({
    saison: { id: saison.id, libelle: saison.libelle },
    garderie: { lieux: g.lieux, limite: libelleLimite(g), ouverte: garderieOuverte(c, g), provisoire: g.provisoire, fin: g.fin },
    mercredis: mercredisOuverts(g)
      .filter((m) => m >= aujourdhui)
      .map((m) => ({ date: m, modifiable: modifiable(g, m, maintenant) })),
    enfants: enfants.map((e) => ({
      id: e.id,
      prenom: e.prenom,
      nom: e.nom,
      peutInscrire: e.peut_inscrire === 1,
      demandes: demandes.filter((d) => d.adherent_id === e.id).map(({ date, lieu }) => ({ date, lieu })),
    })),
  });
});

/** Contrôles communs : garderie ouverte, enfant lié avec le droit d'inscrire, lieu connu. */
async function controleGarderie(c: Context<AppEnv>) {
  const g = (await saisonCourante(c)).referentiel.garderie;
  if (!garderieOuverte(c, g)) return { erreur: c.json({ error: 'La garderie n’est pas encore ouverte sur le site' }, 409) };
  const adherentId = Number(c.req.param('adherentId')) || 0;
  const lien = await c.env.DB.prepare(
    'SELECT l.peut_inscrire FROM liens l JOIN adherents a ON a.id = l.adherent_id WHERE l.user_id = ? AND l.adherent_id = ? AND a.supprime_le IS NULL',
  )
    .bind(c.get('utilisateur').id, adherentId)
    .first<{ peut_inscrire: number }>();
  if (lien?.peut_inscrire !== 1) return { erreur: c.json({ error: 'Vous ne pouvez pas faire de demande pour cet enfant' }, 403) };
  return { g, adherentId };
}

const lieuDemande = (g: ReglagesGarderie, v: unknown) => (typeof v === 'string' && g.lieux.includes(v) ? v : g.lieux[0] ?? '');

famille.put('/garderie/:adherentId/:date', async (c) => {
  const r = await controleGarderie(c);
  if ('erreur' in r) return r.erreur;
  const date = c.req.param('date');
  if (!mercredisOuverts(r.g).includes(date)) return c.json({ error: 'Pas de garderie ce jour-là' }, 409);
  if (!modifiable(r.g, date, maintenantParis())) return c.json({ error: `Délai dépassé (${libelleLimite(r.g)}) : contactez le bureau` }, 409);
  const corps = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  await c.env.DB.prepare(
    `INSERT INTO garderie_demandes (adherent_id, date, lieu, demande_par) VALUES (?, ?, ?, ?)
     ON CONFLICT (adherent_id, date) DO UPDATE SET lieu = excluded.lieu`,
  )
    .bind(r.adherentId, date, lieuDemande(r.g, corps.lieu), c.get('utilisateur').id)
    .run();
  return c.json({ ok: true });
});

famille.delete('/garderie/:adherentId/:date', async (c) => {
  const r = await controleGarderie(c);
  if ('erreur' in r) return r.erreur;
  const date = c.req.param('date');
  if (!modifiable(r.g, date, maintenantParis())) return c.json({ error: `Délai dépassé (${libelleLimite(r.g)}) : contactez le bureau` }, 409);
  await c.env.DB.prepare('DELETE FROM garderie_demandes WHERE adherent_id = ? AND date = ?').bind(r.adherentId, date).run();
  return c.json({ ok: true });
});

// « Tous les mercredis jusqu'au … » : chaque mercredi ouvert et encore modifiable de la période.
famille.post('/garderie/:adherentId/serie', async (c) => {
  const r = await controleGarderie(c);
  if ('erreur' in r) return r.erreur;
  const corps = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const jusquau = typeof corps.jusquau === 'string' ? corps.jusquau : r.g.fin;
  const maintenant = maintenantParis();
  const dates = mercredisOuverts(r.g).filter((m) => m <= jusquau && modifiable(r.g, m, maintenant));
  if (!dates.length) return c.json({ error: 'Aucun mercredi à demander sur cette période' }, 409);
  const lieu = lieuDemande(r.g, corps.lieu);
  const moi = c.get('utilisateur').id;
  await c.env.DB.batch(
    dates.map((d) =>
      c.env.DB.prepare(
        `INSERT INTO garderie_demandes (adherent_id, date, lieu, demande_par) VALUES (?, ?, ?, ?)
         ON CONFLICT (adherent_id, date) DO UPDATE SET lieu = excluded.lieu`,
      ).bind(r.adherentId, d, lieu, moi),
    ),
  );
  return c.json({ ok: true, mercredis: dates.length });
});

famille.put('/moi', async (c) => {
  let corps: Record<string, unknown> = {};
  try {
    corps = (await c.req.json()) as Record<string, unknown>;
  } catch {
    /* corps vide → validation */
  }
  const r = validerTelephoneSeul(corps);
  if (!r.ok) return c.json({ error: 'Saisie invalide', erreurs: r.erreurs }, 400);
  await c.env.DB.prepare('UPDATE users SET telephone = ? WHERE id = ?').bind(r.valeur.telephone, c.get('utilisateur').id).run();
  return c.json({ ok: true });
});
