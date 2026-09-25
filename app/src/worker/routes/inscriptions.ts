// Dossier d'adhésion rempli en ligne par la famille (spec 010b), pour la saison dont le bureau a
// ouvert les inscriptions. Remplit : un responsable légal (mère, père, tuteur) pour son enfant,
// l'adhérent majeur pour lui-même. Le Worker calcule et fige le montant ; chaque consentement est
// une réponse explicite, datée, au nom de ce responsable. Modifiable jusqu'à la validation du bureau.
// Monté sous /api/famille (connexion requise).
import { Hono, type Context } from 'hono';
import {
  calculerMontant,
  estMineur,
  etatDossier,
  formaliteDeLaFamille,
  formuleParId,
  formuleProposee,
  horsCommuneSuggere,
  type Recueil,
} from '../../../web/src/content/adhesion';
import type { AppEnv } from '../droits';
import { saisonInscriptions } from '../saison';
import { effacerPhoto } from '../photos';
import { validerAdherent, validerDossierFamille } from '../validation';
import { aujourdhuiParis } from './competitions';

export const inscriptions = new Hono<AppEnv>();

type Fiche = {
  id: number;
  prenom: string;
  nom: string;
  date_naissance: string;
  sexe: string;
  grade: string | null;
  numero_licence: string | null;
  adresse: string | null;
  code_postal: string | null;
  ville: string | null;
  user_id: number | null;
  propose_par: number | null;
  qualite: string | null;
};

type Dossier = {
  id: number;
  saison: string;
  formule: string;
  passeport: number;
  hors_commune: number;
  reduction_famille: number;
  montant_participation: number;
  montant_licence: number;
  montant_supplements: number;
  montant_reduction: number;
  montant_total: number;
  paiement_mode: string | null;
  paiement_3_fois: number;
  echeance_1: number;
  echeance_2: number;
  echeance_3: number;
  formalite_type: string | null;
  formalite_recue_le: string | null;
  formalite_par: number | null;
  soins_urgence: Recueil;
  droit_image: Recueil;
  whatsapp: Recueil;
  photo_garderie: Recueil;
  envoye_le: string | null;
  valide_le: string | null;
} & Record<string, unknown>;

/** Adhérents dont je remplis le dossier : mes enfants (responsable légal) et moi-même (adhérent majeur). */
const MES_ADHERENTS = `SELECT a.id, a.prenom, a.nom, a.date_naissance, a.sexe, a.grade, a.numero_licence, a.adresse, a.code_postal, a.ville,
    a.user_id, a.propose_par, l.qualite
  FROM adherents a LEFT JOIN liens l ON l.adherent_id = a.id AND l.user_id = ?1
  WHERE a.supprime_le IS NULL AND (l.qualite IN ('mere', 'pere', 'tuteur') OR a.user_id = ?1)`;

const monAdherent = (c: Context<AppEnv>, id: number) =>
  c.env.DB.prepare(`${MES_ADHERENTS} AND a.id = ?2`).bind(c.get('utilisateur').id, id).first<Fiche>();

/**
 * Réduction famille : un frère ou une sœur (même responsable) a déjà un dossier de la saison, créé
 * AVANT celui-ci — la 2ᵉ licence est réduite, pas la première, même si on la renvoie ensuite.
 */
async function reductionFamille(c: Context<AppEnv>, adherentId: number, saison: string, dossierId: number | null): Promise<boolean> {
  const r = await c.env.DB.prepare(
    `SELECT count(DISTINCT d.adherent_id) AS n
     FROM liens l1 JOIN liens l2 ON l2.user_id = l1.user_id AND l2.adherent_id != l1.adherent_id
     JOIN adhesions d ON d.adherent_id = l2.adherent_id AND d.saison = ?1
     JOIN adherents a ON a.id = d.adherent_id AND a.supprime_le IS NULL
     WHERE l1.adherent_id = ?2 AND (?3 IS NULL OR d.id < ?3)`,
  )
    .bind(saison, adherentId, dossierId)
    .first<{ n: number }>();
  return (r?.n ?? 0) > 0;
}

/** Ce que la famille voit de son dossier (sans les identifiants des auteurs). */
const pourFamille = (d: Dossier) => ({
  formule: d.formule,
  passeport: d.passeport,
  hors_commune: d.hors_commune,
  reduction_famille: d.reduction_famille,
  montant_participation: d.montant_participation,
  montant_licence: d.montant_licence,
  montant_supplements: d.montant_supplements,
  montant_reduction: d.montant_reduction,
  montant_total: d.montant_total,
  paiement_mode: d.paiement_mode,
  paiement_3_fois: d.paiement_3_fois,
  echeance_1: d.echeance_1,
  echeance_2: d.echeance_2,
  echeance_3: d.echeance_3,
  formalite_type: d.formalite_type,
  formalite_recue_le: d.formalite_recue_le,
  soins_urgence: d.soins_urgence,
  droit_image: d.droit_image,
  whatsapp: d.whatsapp,
  photo_garderie: d.photo_garderie,
  envoye_le: d.envoye_le,
  valide_le: d.valide_le,
});

/** Un dossier se modifie en ligne s'il n'existe pas encore, ou s'il a été envoyé par la famille et pas encore validé. */
const modifiable = (d: Dossier | null) => !d || (d.envoye_le !== null && d.valide_le === null);

inscriptions.get('/', async (c) => {
  const saison = await saisonInscriptions(c);
  if (!saison) return c.json({ saison: null, adherents: [] });
  const moi = c.get('utilisateur').id;
  const { results: fiches } = await c.env.DB.prepare(`${MES_ADHERENTS} ORDER BY a.date_naissance DESC`).bind(moi).all<Fiche>();
  const ids = JSON.stringify(fiches.map((f) => f.id));
  const [dossiers, precedents, responsables] = await c.env.DB.batch([
    c.env.DB.prepare('SELECT * FROM adhesions WHERE saison = ? AND adherent_id IN (SELECT value FROM json_each(?))').bind(saison.id, ids),
    // Dossier de la saison précédente la plus récente : la réinscription le reprend, à confirmer.
    c.env.DB.prepare(
      `SELECT * FROM adhesions d WHERE d.saison < ?1 AND d.adherent_id IN (SELECT value FROM json_each(?2))
       ORDER BY d.saison DESC`,
    ).bind(saison.id, ids),
    c.env.DB.prepare(
      `SELECT l.adherent_id, u.prenom, u.nom, l.qualite FROM liens l JOIN users u ON u.id = l.user_id
       WHERE u.supprime_le IS NULL AND l.adherent_id IN (SELECT value FROM json_each(?)) ORDER BY u.nom, u.prenom`,
    ).bind(ids),
  ]);
  const ds = (dossiers?.results ?? []) as Dossier[];
  const ps = (precedents?.results ?? []) as Dossier[];
  const rs = (responsables?.results ?? []) as { adherent_id: number; prenom: string; nom: string; qualite: string }[];

  const adherents = [];
  for (const f of fiches) {
    const dossier = ds.find((d) => d.adherent_id === f.id) ?? null;
    const precedent = ps.find((d) => d.adherent_id === f.id) ?? null;
    const mineur = estMineur(f.date_naissance);
    const liste = rs.filter((r) => r.adherent_id === f.id);
    const { user_id, propose_par, qualite: _, ...adherent } = f;
    adherents.push({
      adherent,
      moi: user_id === moi,
      mineur,
      aVerifier: propose_par !== null,
      ficheModifiable: propose_par === moi && !dossier?.valide_le,
      responsables: liste.map(({ prenom, nom, qualite }) => ({ prenom, nom, qualite })),
      dossier: dossier && pourFamille(dossier),
      etat: dossier ? etatDossier(dossier, { mineur, responsables: liste.length }) : null,
      modifiable: modifiable(dossier),
      precedent: precedent && {
        saison: precedent.saison,
        formule: precedent.formule,
        passeport: precedent.passeport === 1,
        paiement_mode: precedent.paiement_mode,
        paiement_3_fois: precedent.paiement_3_fois === 1,
        soins_urgence: precedent.soins_urgence,
        droit_image: precedent.droit_image,
        whatsapp: precedent.whatsapp,
        photo_garderie: precedent.photo_garderie,
      },
      proposition: {
        formule: formuleProposee(saison.referentiel.tarifs, Number(f.date_naissance.slice(0, 4)), precedent?.formule ?? null),
        reductionFamille: await reductionFamille(c, f.id, saison.id, dossier?.id ?? null),
      },
    });
  }
  return c.json({
    saison: { id: saison.id, libelle: saison.libelle, tarifs: saison.referentiel.tarifs, echeances3Fois: saison.referentiel.echeances3Fois },
    adherents,
  });
});

// Envoyer (ou renvoyer, tant que le bureau n'a pas validé) le dossier d'un adhérent.
inscriptions.put('/:id{[0-9]+}', async (c) => {
  const saison = await saisonInscriptions(c);
  if (!saison) return c.json({ error: 'Les inscriptions en ligne ne sont pas ouvertes' }, 409);
  const fiche = await monAdherent(c, Number(c.req.param('id')));
  if (!fiche) return c.json({ error: 'Vous ne pouvez pas remplir le dossier de cet adhérent' }, 403);
  const avant = await c.env.DB.prepare('SELECT * FROM adhesions WHERE adherent_id = ? AND saison = ?').bind(fiche.id, saison.id).first<Dossier>();
  if (!modifiable(avant)) {
    return c.json(
      { error: avant?.valide_le ? 'Dossier déjà validé par le bureau : pour le modifier, adressez-vous au bureau' : 'Ce dossier a été enregistré par le club : adressez-vous au bureau' },
      409,
    );
  }
  const mineur = estMineur(fiche.date_naissance);
  const tarifs = saison.referentiel.tarifs;
  const r = validerDossierFamille((await c.req.json().catch(() => ({}))) as Record<string, unknown>, tarifs, mineur);
  if (!r.ok) return c.json({ error: 'Saisie invalide', erreurs: r.erreurs }, 400);
  const s = r.valeur;
  const passeport = s.passeport === 1 && !!formuleParId(tarifs, s.formule)?.judo;
  const horsCommune = horsCommuneSuggere(s.code_postal);
  const reduction = await reductionFamille(c, fiche.id, saison.id, avant?.id ?? null);
  const m = calculerMontant(tarifs, { formule: s.formule, passeport, horsCommune, reductionFamille: reduction });
  if (!m) return c.json({ error: 'Saisie invalide', erreurs: { formule: 'Formule inconnue' } }, 400);
  const moi = c.get('utilisateur').id;
  const maintenant = new Date().toISOString().slice(0, 19).replace('T', ' ');
  // Consentement : date et auteur mis à jour quand la réponse change (sinon ceux de la première réponse).
  const trace = (champ: 'soins_urgence' | 'droit_image' | 'whatsapp' | 'photo_garderie'): [unknown, unknown] => {
    if (avant?.[champ] === s[champ]) return [avant[`${champ}_le`] ?? null, avant[`${champ}_par`] ?? null];
    return s[champ] === 'non_recueilli' ? [null, null] : [maintenant, moi];
  };
  // Formalité : attestation cochée en ligne = « reçue » aujourd'hui, par ce responsable ; certificat : à recevoir par le bureau.
  const formalite = formaliteDeLaFamille(s.sante, mineur);
  const [recueLe, recuePar] =
    s.sante === 'certificat'
      ? avant?.formalite_type === 'certificat'
        ? [avant.formalite_recue_le, avant.formalite_par]
        : [null, null]
      : avant?.formalite_type === formalite && avant.formalite_recue_le
        ? [avant.formalite_recue_le, avant.formalite_par]
        : [aujourdhuiParis(), moi];
  const [soinsLe, soinsPar] = trace('soins_urgence');
  const [imageLe, imagePar] = trace('droit_image');
  const [whatsappLe, whatsappPar] = trace('whatsapp');
  const [photoLe, photoPar] = trace('photo_garderie');
  // Le WHERE de l'upsert protège un dossier validé ou saisi par le bureau entre-temps.
  await c.env.DB.batch([
    c.env.DB.prepare(
      `INSERT INTO adhesions (adherent_id, saison, formule, passeport, hors_commune, reduction_famille,
         montant_participation, montant_licence, montant_supplements, montant_reduction, montant_total,
         paiement_mode, paiement_3_fois, echeance_1, echeance_2, echeance_3, formalite_type, formalite_recue_le, formalite_par,
         soins_urgence, soins_urgence_le, soins_urgence_par, droit_image, droit_image_le, droit_image_par,
         whatsapp, whatsapp_le, whatsapp_par, photo_garderie, photo_garderie_le, photo_garderie_par,
         engagements_le, engagements_par, envoye_le, envoye_par, cree_par)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18, ?19, ?20, ?21, ?22, ?23, ?24, ?25,
               ?26, ?27, ?28, ?29, ?30, ?31, ?32, ?33, ?32, ?33, ?33)
       ON CONFLICT (adherent_id, saison) DO UPDATE SET
         formule = excluded.formule, passeport = excluded.passeport, hors_commune = excluded.hors_commune,
         reduction_famille = excluded.reduction_famille, montant_participation = excluded.montant_participation,
         montant_licence = excluded.montant_licence, montant_supplements = excluded.montant_supplements,
         montant_reduction = excluded.montant_reduction, montant_total = excluded.montant_total,
         paiement_mode = excluded.paiement_mode, paiement_3_fois = excluded.paiement_3_fois,
         echeance_1 = excluded.echeance_1, echeance_2 = excluded.echeance_2, echeance_3 = excluded.echeance_3,
         formalite_type = excluded.formalite_type, formalite_recue_le = excluded.formalite_recue_le, formalite_par = excluded.formalite_par,
         soins_urgence = excluded.soins_urgence, soins_urgence_le = excluded.soins_urgence_le, soins_urgence_par = excluded.soins_urgence_par,
         droit_image = excluded.droit_image, droit_image_le = excluded.droit_image_le, droit_image_par = excluded.droit_image_par,
         whatsapp = excluded.whatsapp, whatsapp_le = excluded.whatsapp_le, whatsapp_par = excluded.whatsapp_par,
         photo_garderie = excluded.photo_garderie, photo_garderie_le = excluded.photo_garderie_le, photo_garderie_par = excluded.photo_garderie_par,
         engagements_le = excluded.engagements_le, engagements_par = excluded.engagements_par,
         envoye_le = excluded.envoye_le, envoye_par = excluded.envoye_par, updated_at = datetime('now')
       WHERE adhesions.valide_le IS NULL AND adhesions.envoye_le IS NOT NULL`,
    ).bind(
      fiche.id, saison.id, s.formule, passeport ? 1 : 0, horsCommune ? 1 : 0, reduction ? 1 : 0,
      m.participation, m.licence, m.supplements, m.reduction, m.total,
      s.paiement_mode, s.paiement_3_fois, m.echeancier[0], m.echeancier[1], m.echeancier[2], formalite, recueLe, recuePar,
      s.soins_urgence, soinsLe, soinsPar, s.droit_image, imageLe, imagePar,
      s.whatsapp, whatsappLe, whatsappPar, s.photo_garderie, photoLe, photoPar,
      maintenant, moi,
    ),
    // La famille tient son adresse à jour (le reste de la fiche : par le bureau).
    c.env.DB.prepare("UPDATE adherents SET adresse = ?, code_postal = ?, ville = ?, updated_at = datetime('now') WHERE id = ?").bind(
      s.adresse,
      s.code_postal,
      s.ville,
      fiche.id,
    ),
    // Sans accord « photo pour la garderie » cette saison-ci, la photo déposée est effacée (spec 012b).
    ...(saison.courante && s.photo_garderie !== 'oui' ? [effacerPhoto(c.env, fiche.id)] : []),
  ]);
  return c.json({ ok: true });
});

// --- Nouvel enfant, inconnu du club : fiche « à vérifier » par le bureau ---

const MAX_ENFANTS_PROPOSES = 6;
const QUALITES_LEGALES = ['mere', 'pere', 'tuteur'];

inscriptions.post('/enfants', async (c) => {
  if (!(await saisonInscriptions(c))) return c.json({ error: 'Les inscriptions en ligne ne sont pas ouvertes' }, 409);
  const corps = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const r = validerAdherent(corps);
  const erreurs: Record<string, string> = r.ok ? {} : { ...r.erreurs };
  if (!QUALITES_LEGALES.includes(corps.qualite as string)) erreurs.qualite = 'Votre lien avec l’enfant : mère, père ou tuteur';
  if (r.ok && !estMineur(r.valeur.date_naissance)) erreurs.date_naissance = 'Un adhérent majeur s’inscrit lui-même : qu’il contacte le bureau';
  if (!r.ok || Object.keys(erreurs).length) return c.json({ error: 'Saisie invalide', erreurs }, 400);
  const a = r.valeur;
  const moi = c.get('utilisateur').id;
  const [deja, proposes] = await c.env.DB.batch([
    c.env.DB.prepare('SELECT 1 FROM adherents WHERE supprime_le IS NULL AND lower(prenom) = lower(?) AND lower(nom) = lower(?) AND date_naissance = ?').bind(
      a.prenom,
      a.nom,
      a.date_naissance,
    ),
    c.env.DB.prepare('SELECT count(*) AS n FROM adherents WHERE propose_par = ? AND supprime_le IS NULL').bind(moi),
  ]);
  if (deja?.results.length) return c.json({ error: 'Cet enfant est déjà connu du club : demandez au bureau de le rattacher à votre compte' }, 409);
  if (((proposes?.results[0] as { n: number } | undefined)?.n ?? 0) >= MAX_ENFANTS_PROPOSES) {
    return c.json({ error: 'Trop d’enfants en attente de vérification : contactez le bureau' }, 409);
  }
  const cree = await c.env.DB.prepare(
    `INSERT INTO adherents (prenom, nom, date_naissance, sexe, grade, numero_licence, adresse, code_postal, ville, propose_par)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`,
  )
    .bind(a.prenom, a.nom, a.date_naissance, a.sexe, a.grade, a.numero_licence, a.adresse, a.code_postal, a.ville, moi)
    .first<{ id: number }>();
  if (!cree) return c.json({ error: 'Enregistrement impossible' }, 500);
  await c.env.DB.prepare('INSERT INTO liens (user_id, adherent_id, qualite, peut_inscrire, peut_recuperer, est_contact) VALUES (?, ?, ?, 1, 1, 1)')
    .bind(moi, cree.id, corps.qualite)
    .run();
  return c.json({ id: cree.id }, 201);
});

// Corriger la fiche d'un enfant qu'on vient d'ajouter, tant que le bureau ne l'a pas vérifiée.
inscriptions.put('/enfants/:id{[0-9]+}', async (c) => {
  const r = validerAdherent((await c.req.json().catch(() => ({}))) as Record<string, unknown>);
  if (!r.ok) return c.json({ error: 'Saisie invalide', erreurs: r.erreurs }, 400);
  if (!estMineur(r.valeur.date_naissance)) return c.json({ error: 'Saisie invalide', erreurs: { date_naissance: 'Date de naissance d’un mineur' } }, 400);
  const a = r.valeur;
  const res = await c.env.DB.prepare(
    `UPDATE adherents SET prenom = ?, nom = ?, date_naissance = ?, sexe = ?, grade = ?, numero_licence = ?, updated_at = datetime('now')
     WHERE id = ? AND propose_par = ? AND supprime_le IS NULL`,
  )
    .bind(a.prenom, a.nom, a.date_naissance, a.sexe, a.grade, a.numero_licence, Number(c.req.param('id')), c.get('utilisateur').id)
    .run();
  return res.meta.changes ? c.json({ ok: true }) : c.json({ error: 'Fiche déjà vérifiée par le bureau : adressez-vous à lui' }, 409);
});
