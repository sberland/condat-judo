// Espace famille (spec 004) — tout compte connecté. Un responsable ne voit QUE les adhérents
// auxquels il est lié (filtre sur `liens.user_id` = lui-même, côté SQL). v1 : consultation, et mise
// à jour de son propre téléphone ; la modification des fiches enfants viendra avec la spec 010.
import { Hono, type Context } from 'hono';
import { SAISON } from '../../../web/src/content/adhesion';
import { categorieDe, eligible } from '../../../web/src/content/categories';
import { ECHEANCES_3_FOIS, exigible, situation } from '../../../web/src/content/paiements';
import { connexionRequise, type AppEnv } from '../droits';
import { aujourdhuiParis, COLONNES_COMPETITION, inscriptionsOuvertes, lireCompetition, versCompetition } from './competitions';
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
  return c.json({
    inscriptionsOuvertes: inscriptionsOuvertes(comp),
    enfants: results.map((e) => ({
      id: e.id,
      prenom: e.prenom,
      nom: e.nom,
      categorie: categorieDe(e.date_naissance)?.nom ?? null,
      eligible: eligible(e, comp),
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
  return c.json(
    ((comps?.results ?? []) as Parameters<typeof versCompetition>[0][]).map(versCompetition).map((comp) => ({
      competition_id: comp.id,
      enfants: mesEnfants
        .map((e) => ({ prenom: e.prenom, inscrit: inscrits.has(`${comp.id}-${e.id}`), eligible: eligible(e, comp) }))
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
  if (!eligible(r.enfant, r.comp)) return c.json({ error: 'Cet enfant n’est pas dans les catégories de la compétition' }, 409);
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
  const { results: dossiers } = await c.env.DB.prepare(
    `SELECT d.id AS adhesion_id, a.prenom, a.nom, d.formule, d.montant_total, d.paiement_3_fois,
            d.echeance_1, d.echeance_2, d.echeance_3,
            COALESCE((SELECT sum(p.montant) FROM paiement_parts p WHERE p.adhesion_id = d.id), 0) AS paye
     FROM adhesions d JOIN adherents a ON a.id = d.adherent_id
     WHERE d.saison = ?1 AND (d.adherent_id IN (SELECT adherent_id FROM liens WHERE user_id = ?2) OR a.user_id = ?2)
     ORDER BY a.date_naissance DESC`,
  )
    .bind(SAISON.id, moi)
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
    saison: SAISON,
    echeances: ECHEANCES_3_FOIS,
    dossiers: dossiers.map((d) => ({
      ...d,
      ...situation(d.montant_total, d.paye, exigible(d, jour)),
      versements: versements.filter((v) => v.adhesion_id === d.adhesion_id).map(({ adhesion_id: _, ...v }) => v),
    })),
  });
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
