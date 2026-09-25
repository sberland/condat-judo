// Espace famille (spec 004) — tout compte connecté. Un responsable ne voit QUE les adhérents
// auxquels il est lié (filtre sur `liens.user_id` = lui-même, côté SQL). v1 : consultation, et mise
// à jour de son propre téléphone ; la modification des fiches enfants viendra avec la spec 010.
import { Hono, type Context } from 'hono';
import { categorieDe, eligible, type Categorie } from '../../../web/src/content/categories';
import { exigible, situation } from '../../../web/src/content/paiements';
import { MAX_PARTICIPANTS } from '../../../web/src/content/evenements';
import { etatPointage, libelleLimite, maintenantParis, mercredisOuverts, modifiable, type Pointage, type ReglagesGarderie } from '../../../web/src/content/garderie';
import { connexionRequise, type AppEnv } from '../droits';
import { aujourdhuiParis, COLONNES_COMPETITION, inscriptionsOuvertes, lireCompetition, versCompetition } from './competitions';
import { donneesDuCompte } from '../export';
import { saisonCourante, saisonPourDate } from '../saison';
import { accordPhoto, effacerPhoto, enregistrerPhoto, lirePhoto, PHOTO_RECENTE, reponsePhoto } from '../photos';
import { validerPersonneAutorisee, validerPhoto, validerTelephoneSeul } from '../validation';

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
  photo_le: string | null;
  accord_photo: string | null;
};

famille.get('/enfants', async (c) => {
  const moi = c.get('utilisateur').id;
  const saison = await saisonCourante(c);
  const { results: enfants } = await c.env.DB.prepare(
    `SELECT a.id, a.prenom, a.nom, a.date_naissance, a.sexe, a.grade, a.numero_licence,
            l.qualite, l.peut_inscrire, l.peut_recuperer, l.est_contact,
            (SELECT p.deposee_le FROM photos_adherents p WHERE p.adherent_id = a.id AND ${PHOTO_RECENTE}) AS photo_le,
            (SELECT d.photo_garderie FROM adhesions d WHERE d.adherent_id = a.id AND d.saison = ?2) AS accord_photo
     FROM liens l JOIN adherents a ON a.id = l.adherent_id
     WHERE l.user_id = ?1 AND a.supprime_le IS NULL
     ORDER BY a.date_naissance DESC`,
  )
    .bind(moi, saison.id)
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
      `SELECT id, adherent_id, prenom, nom, lien FROM personnes_autorisees
       WHERE adherent_id IN (SELECT adherent_id FROM liens WHERE user_id = ?) ORDER BY nom, prenom`,
    ).bind(moi),
    c.env.DB.prepare(
      `SELECT i.adherent_id, co.id, co.nom, co.date, co.statut, co.type FROM inscriptions_competition i
       JOIN competitions co ON co.id = i.competition_id
       WHERE i.adherent_id IN (SELECT adherent_id FROM liens WHERE user_id = ?)
       ORDER BY co.date DESC`,
    ).bind(moi),
  ]);
  type Co = { adherent_id: number; prenom: string; nom: string; qualite: string };
  type Pa = { id: number; adherent_id: number; prenom: string; nom: string; lien: string };
  type Ic = { adherent_id: number; id: number; nom: string; date: string; statut: string; type: string };
  const co = (coResponsables?.results ?? []) as Co[];
  const pa = (personnes?.results ?? []) as Pa[];
  const ic = (competitions?.results ?? []) as Ic[];

  return c.json(
    enfants.map(({ photo_le, accord_photo, ...e }) => ({
      ...e,
      responsableLegal: ['mere', 'pere', 'tuteur'].includes(e.qualite),
      // Photo pour la garderie (012b) : dossier de la saison requis pour recueillir l'accord.
      photo: { deposeeLe: photo_le, accord: accord_photo },
      coResponsables: co.filter((r) => r.adherent_id === e.id).map(({ prenom, nom, qualite }) => ({ prenom, nom, qualite })),
      personnesAutorisees: pa.filter((p) => p.adherent_id === e.id).map(({ id, prenom, nom, lien }) => ({ id, prenom, nom, lien })),
      competitions: ic.filter((i) => i.adherent_id === e.id).map(({ id, nom, date, statut, type }) => ({ id, nom, date, statut, type })),
    })),
  );
});

// --- Photo pour la garderie et personnes autorisées (spec 012b) ---

/** Lien du responsable connecté avec cet enfant (actif), ou null. */
async function monLien(c: Context<AppEnv>, adherentId: number) {
  return c.env.DB.prepare(
    `SELECT l.qualite, l.peut_inscrire FROM liens l JOIN adherents a ON a.id = l.adherent_id
     WHERE l.user_id = ? AND l.adherent_id = ? AND a.supprime_le IS NULL`,
  )
    .bind(c.get('utilisateur').id, adherentId)
    .first<{ qualite: string; peut_inscrire: number }>();
}

/** Mère, père ou tuteur : répond aux accords et dépose la photo de l'enfant (specs 019, 012b). */
const estResponsableLegal = (l: { qualite: string } | null) => !!l && ['mere', 'pere', 'tuteur'].includes(l.qualite);

famille.get('/enfants/:id/photo', async (c) => {
  const adherentId = Number(c.req.param('id')) || 0;
  if (!(await monLien(c, adherentId))) return c.json({ error: 'Pas de photo' }, 404);
  return reponsePhoto(c, await lirePhoto(c.env, adherentId));
});

// Déposer (ou remplacer) la photo : un responsable légal ; l'accord est donné en même temps si besoin.
famille.put('/enfants/:id/photo', async (c) => {
  const adherentId = Number(c.req.param('id')) || 0;
  if (!estResponsableLegal(await monLien(c, adherentId))) return c.json({ error: 'Seul un responsable légal peut déposer la photo' }, 403);
  const corps = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const r = validerPhoto(corps);
  if (!r.ok) return c.json({ error: r.erreurs.image ?? 'Photo invalide', erreurs: r.erreurs }, 400);
  const saison = await saisonCourante(c);
  const accord = await accordPhoto(c.env, adherentId, saison.id);
  if (accord === null) return c.json({ error: 'Le dossier d’adhésion de la saison doit d’abord être enregistré par le bureau' }, 409);
  if (accord !== 'oui' && corps.accord !== true) return c.json({ error: 'Donnez d’abord votre accord pour la photo' }, 409);
  const moi = c.get('utilisateur').id;
  await c.env.DB.batch([
    ...(accord === 'oui'
      ? []
      : [
          c.env.DB.prepare(
            `UPDATE adhesions SET photo_garderie = 'oui', photo_garderie_le = datetime('now'), photo_garderie_par = ?, updated_at = datetime('now')
             WHERE adherent_id = ? AND saison = ?`,
          ).bind(moi, adherentId, saison.id),
        ]),
    enregistrerPhoto(c.env, adherentId, r.valeur, moi),
  ]);
  return c.json({ ok: true });
});

famille.delete('/enfants/:id/photo', async (c) => {
  const adherentId = Number(c.req.param('id')) || 0;
  if (!estResponsableLegal(await monLien(c, adherentId))) return c.json({ error: 'Seul un responsable légal peut retirer la photo' }, 403);
  await effacerPhoto(c.env, adherentId).run();
  return c.json({ ok: true });
});

// Personnes autorisées à récupérer l'enfant : gérées par un responsable qui peut l'inscrire.
famille.post('/enfants/:id/personnes-autorisees', async (c) => {
  const adherentId = Number(c.req.param('id')) || 0;
  if ((await monLien(c, adherentId))?.peut_inscrire !== 1) return c.json({ error: 'Vous ne pouvez pas modifier cette liste' }, 403);
  const r = validerPersonneAutorisee((await c.req.json().catch(() => ({}))) as Record<string, unknown>);
  if (!r.ok) return c.json({ error: 'Saisie invalide', erreurs: r.erreurs }, 400);
  const p = r.valeur;
  const cree = await c.env.DB.prepare('INSERT INTO personnes_autorisees (adherent_id, prenom, nom, lien, telephone) VALUES (?, ?, ?, ?, ?) RETURNING id')
    .bind(adherentId, p.prenom, p.nom, p.lien, p.telephone)
    .first<{ id: number }>();
  return c.json({ id: cree?.id }, 201);
});

famille.delete('/enfants/:id/personnes-autorisees/:pid', async (c) => {
  const adherentId = Number(c.req.param('id')) || 0;
  if ((await monLien(c, adherentId))?.peut_inscrire !== 1) return c.json({ error: 'Vous ne pouvez pas modifier cette liste' }, 403);
  const res = await c.env.DB.prepare('DELETE FROM personnes_autorisees WHERE id = ? AND adherent_id = ?')
    .bind(Number(c.req.param('pid')) || 0, adherentId)
    .run();
  if (!res.meta.changes) return c.json({ error: 'Personne introuvable' }, 404);
  return c.json({ ok: true });
});

// --- Événements (specs 009, 021) : un responsable inscrit SES enfants, s'il en a le droit, ou sa
// famille (nombre de participants) selon le mode d'inscription choisi par le bureau ---

type EnfantCompetition = {
  id: number;
  prenom: string;
  nom: string;
  date_naissance: string;
  sexe: 'F' | 'M';
  peut_inscrire: number;
  inscrit: number;
};

/** Famille inscrite à un événement (mode « famille ») : nombre d'adultes et d'enfants, ou null. */
const MA_FAMILLE = 'SELECT adultes, enfants FROM inscriptions_famille WHERE competition_id = ? AND user_id = ?';

/** Mes enfants face à un événement : catégorie, éligibilité, droit d'inscrire, inscription ; ou ma famille. */
famille.get('/competitions/:id', async (c) => {
  const comp = await lireCompetition(c, Number(c.req.param('id')) || 0);
  if (!comp) return c.json({ error: 'Événement introuvable' }, 404);
  if (comp.inscription !== 'enfants') {
    const f = await c.env.DB.prepare(MA_FAMILLE).bind(comp.id, c.get('utilisateur').id).first<{ adultes: number; enfants: number }>();
    return c.json({ inscriptionsOuvertes: inscriptionsOuvertes(comp), enfants: [], famille: f ?? null });
  }
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
    famille: null,
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

/** Pour chaque événement à venir : mes enfants concernés (éligibles ou déjà inscrits), ou ma famille. */
famille.get('/competitions', async (c) => {
  const moi = c.get('utilisateur').id;
  const [comps, enfants, inscriptions, mesFamilles] = await c.env.DB.batch([
    c.env.DB.prepare(`SELECT ${COLONNES_COMPETITION} FROM competitions WHERE date >= ?`).bind(aujourdhuiParis()),
    c.env.DB.prepare(
      `SELECT a.id, a.prenom, a.date_naissance, a.sexe FROM liens l JOIN adherents a ON a.id = l.adherent_id
       WHERE l.user_id = ? AND a.supprime_le IS NULL ORDER BY a.date_naissance DESC`,
    ).bind(moi),
    c.env.DB.prepare(
      `SELECT i.competition_id, i.adherent_id FROM inscriptions_competition i
       JOIN liens l ON l.adherent_id = i.adherent_id AND l.user_id = ?`,
    ).bind(moi),
    c.env.DB.prepare('SELECT competition_id, adultes, enfants FROM inscriptions_famille WHERE user_id = ?').bind(moi),
  ]);
  const familles = new Map(((mesFamilles?.results ?? []) as { competition_id: number; adultes: number; enfants: number }[]).map((f) => [f.competition_id, f]));
  type E = { id: number; prenom: string; date_naissance: string; sexe: 'F' | 'M' };
  const mesEnfants = (enfants?.results ?? []) as E[];
  const inscrits = new Set(((inscriptions?.results ?? []) as { competition_id: number; adherent_id: number }[]).map((i) => `${i.competition_id}-${i.adherent_id}`));
  const liste = ((comps?.results ?? []) as Parameters<typeof versCompetition>[0][]).map(versCompetition);
  const categories = new Map<number, Categorie[]>();
  for (const comp of liste) categories.set(comp.id, (await saisonPourDate(c, comp.date)).referentiel.categories);
  return c.json(
    liste.map((comp) => ({
      competition_id: comp.id,
      famille: familles.has(comp.id) ? { adultes: familles.get(comp.id)?.adultes ?? 0, enfants: familles.get(comp.id)?.enfants ?? 0 } : null,
      enfants: (comp.inscription === 'enfants' ? mesEnfants : [])
        .map((e) => ({ prenom: e.prenom, inscrit: inscrits.has(`${comp.id}-${e.id}`), eligible: eligible(categories.get(comp.id) ?? [], e, comp) }))
        .filter((e) => e.inscrit || e.eligible)
        .map(({ prenom, inscrit }) => ({ prenom, inscrit })),
    })),
  );
});

async function controleInscription(c: Context<AppEnv>) {
  const comp = await lireCompetition(c, Number(c.req.param('id')) || 0);
  if (!comp) return { erreur: c.json({ error: 'Événement introuvable' }, 404) };
  if (comp.inscription !== 'enfants') return { erreur: c.json({ error: 'Pas d’inscription d’enfants pour cet événement' }, 409) };
  if (!inscriptionsOuvertes(comp)) return { erreur: c.json({ error: 'Les inscriptions sont closes pour cet événement' }, 409) };
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
  if (!eligible((await saisonPourDate(c, r.comp.date)).referentiel.categories, r.enfant, r.comp)) return c.json({ error: 'Cet enfant n’est pas dans les catégories de l’événement' }, 409);
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

// Inscription de ma famille (mode « famille ») : nombre d'adultes et d'enfants, modifiable ou annulable
// jusqu'à la date limite.
async function controleFamille(c: Context<AppEnv>) {
  const comp = await lireCompetition(c, Number(c.req.param('id')) || 0);
  if (!comp) return { erreur: c.json({ error: 'Événement introuvable' }, 404) };
  if (comp.inscription !== 'famille') return { erreur: c.json({ error: 'Pas d’inscription des familles pour cet événement' }, 409) };
  if (!inscriptionsOuvertes(comp)) return { erreur: c.json({ error: 'Les inscriptions sont closes pour cet événement' }, 409) };
  return { comp };
}

const nombre = (v: unknown) => (Number.isInteger(v) && (v as number) >= 0 && (v as number) <= MAX_PARTICIPANTS ? (v as number) : null);

famille.put('/competitions/:id/famille', async (c) => {
  const r = await controleFamille(c);
  if ('erreur' in r) return r.erreur;
  const corps = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const adultes = nombre(corps.adultes);
  const enfants = nombre(corps.enfants);
  if (adultes === null || enfants === null) return c.json({ error: `Nombre de participants invalide (${MAX_PARTICIPANTS} au plus)` }, 400);
  if (adultes + enfants === 0) return c.json({ error: 'Indiquez au moins un participant' }, 400);
  await c.env.DB.prepare(
    `INSERT INTO inscriptions_famille (competition_id, user_id, adultes, enfants) VALUES (?, ?, ?, ?)
     ON CONFLICT (competition_id, user_id) DO UPDATE SET adultes = excluded.adultes, enfants = excluded.enfants, modifie_le = datetime('now')`,
  )
    .bind(r.comp.id, c.get('utilisateur').id, adultes, enfants)
    .run();
  return c.json({ ok: true });
});

famille.delete('/competitions/:id/famille', async (c) => {
  const r = await controleFamille(c);
  if ('erreur' in r) return r.erreur;
  await c.env.DB.prepare('DELETE FROM inscriptions_famille WHERE competition_id = ? AND user_id = ?').bind(r.comp.id, c.get('utilisateur').id).run();
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
  photo_garderie: string;
  photo_garderie_le: string | null;
  adherent_id: number;
};

// Accords de la saison (droit à l'image, groupe WhatsApp, photo pour la garderie) pour mes enfants — et moi, adhérent majeur.
// Répondent : les responsables légaux (mère, père, tuteur), ou l'adhérent majeur pour lui-même.
const ACCORDS = `SELECT d.id AS adhesion_id, d.adherent_id, a.prenom, l.qualite, d.droit_image, d.droit_image_le, d.whatsapp, d.whatsapp_le,
    d.photo_garderie, d.photo_garderie_le
  FROM adhesions d JOIN adherents a ON a.id = d.adherent_id AND a.supprime_le IS NULL
  LEFT JOIN liens l ON l.adherent_id = a.id AND l.user_id = ?2
  WHERE d.saison = ?1 AND (l.qualite IN ('mere', 'pere', 'tuteur') OR a.user_id = ?2)`;

famille.get('/accords', async (c) => {
  const saison = await saisonCourante(c);
  const { results } = await c.env.DB.prepare(`${ACCORDS} ORDER BY a.date_naissance DESC`).bind(saison.id, c.get('utilisateur').id).all<Accords>();
  return c.json({ saison: { id: saison.id, libelle: saison.libelle }, accords: results.map(({ qualite: _, adherent_id: __, ...a }) => a) });
});

famille.put('/accords/:adhesionId', async (c) => {
  const corps = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const champ = corps.accord;
  const valeur = corps.valeur;
  if ((champ !== 'droit_image' && champ !== 'whatsapp' && champ !== 'photo_garderie') || (valeur !== 'oui' && valeur !== 'non')) return c.json({ error: 'Saisie invalide' }, 400);
  const moi = c.get('utilisateur').id;
  const dossier = await c.env.DB.prepare(`${ACCORDS} AND d.id = ?3`).bind((await saisonCourante(c)).id, moi, Number(c.req.param('adhesionId')) || 0).first<Accords>();
  if (!dossier) return c.json({ error: 'Vous ne pouvez pas répondre pour cet adhérent' }, 403);
  // Colonnes choisies dans une liste fermée (jamais la saisie) : pas d'injection possible.
  await c.env.DB.batch([
    c.env.DB.prepare(`UPDATE adhesions SET ${champ} = ?, ${champ}_le = datetime('now'), ${champ}_par = ?, updated_at = datetime('now') WHERE id = ?`).bind(
      valeur,
      moi,
      dossier.adhesion_id,
    ),
    // Accord « photo pour la garderie » retiré : la photo est effacée aussitôt (spec 012b).
    ...(champ === 'photo_garderie' && valeur === 'non' ? [effacerPhoto(c.env, dossier.adherent_id)] : []),
  ]);
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
    `SELECT d.adherent_id, d.date, d.lieu, d.recupere_le, d.absent_le, d.parti_le, d.parti_avec
     FROM garderie_demandes d JOIN liens l ON l.adherent_id = d.adherent_id AND l.user_id = ?
     WHERE d.date >= ? ORDER BY d.date`,
  )
    .bind(moi, aujourdhui)
    .all<{ adherent_id: number; date: string; lieu: string } & Pointage>();
  return c.json({
    saison: { id: saison.id, libelle: saison.libelle },
    aujourdhui,
    garderie: { lieux: g.lieux, limite: libelleLimite(g), ouverte: garderieOuverte(c, g), provisoire: g.provisoire, fin: g.fin },
    mercredis: mercredisOuverts(g)
      .filter((m) => m >= aujourdhui)
      .map((m) => ({ date: m, modifiable: modifiable(g, m, maintenant) })),
    enfants: enfants.map((e) => ({
      id: e.id,
      prenom: e.prenom,
      nom: e.nom,
      peutInscrire: e.peut_inscrire === 1,
      demandes: demandes
        .filter((d) => d.adherent_id === e.id)
        // Pointage de l'encadrant (spec 012c) : suivi en direct le mercredi même.
        .map(({ date, lieu, recupere_le, absent_le, parti_le, parti_avec }) => ({
          date,
          lieu,
          pointage: { etat: etatPointage({ recupere_le, absent_le, parti_le, parti_avec }), recupere_le, absent_le, parti_le, parti_avec },
        })),
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

// --- Passkeys de mon compte (spec 005c) : liste et retrait ---

famille.get('/passkeys', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT id, appareil, created_at, derniere_utilisation FROM passkeys WHERE user_id = ? ORDER BY created_at DESC')
    .bind(c.get('utilisateur').id)
    .all();
  return c.json(results);
});

famille.delete('/passkeys/:id', async (c) => {
  const res = await c.env.DB.prepare('DELETE FROM passkeys WHERE id = ? AND user_id = ?').bind(c.req.param('id'), c.get('utilisateur').id).run();
  return res.meta.changes ? c.json({ ok: true }) : c.json({ error: 'Passkey introuvable' }, 404);
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
