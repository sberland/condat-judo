// API d'administration (spec 004) — réservée aux rôles `bureau` et `admin` ; la gestion des rôles
// est réservée à `admin`. Adhérents, comptes (responsables légaux), liens, personnes autorisées.
import { Hono, type Context } from 'hono';
import { aUnRole, connexionRequise, roleRequis, type AppEnv } from '../droits';
import { ROLES, type Role } from '../identite';
import { couperAcces, creerLien } from '../session';
import {
  calculerMontant,
  estMineur,
  etatDossier,
  formuleJudoSuggeree,
  horsCommuneSuggere,
  SAISON,
  type Recueil,
} from '../../../web/src/content/adhesion';
import {
  validerAdhesion,
  validerAdherent,
  validerCompte,
  validerLien,
  validerPersonneAutorisee,
  type Resultat,
} from '../validation';

export const admin = new Hono<AppEnv>();
admin.use('*', connexionRequise, roleRequis('bureau', 'admin'));

// --- Outils ---

async function corps(c: Context<AppEnv>): Promise<Record<string, unknown> | null> {
  try {
    const v = await c.req.json();
    return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

const invalide = (c: Context<AppEnv>, r: Resultat<unknown>) =>
  c.json({ error: 'Saisie invalide', erreurs: r.ok ? {} : r.erreurs }, 400);

function id(c: Context<AppEnv>, nom: string): number | null {
  const v = Number(c.req.param(nom));
  return Number.isInteger(v) && v > 0 ? v : null;
}

const recherche = (q: string | undefined) => `%${(q ?? '').trim().toLowerCase()}%`;

// --- Adhérents ---

type AdherentLigne = {
  id: number;
  prenom: string;
  nom: string;
  date_naissance: string;
  sexe: string;
  grade: string | null;
  ville: string | null;
  supprime_le: string | null;
  r_id: number | null;
  r_prenom: string | null;
  r_nom: string | null;
};

admin.get('/adherents', async (c) => {
  const avecSupprimes = c.req.query('supprimes') === '1' ? 1 : 0;
  const { results } = await c.env.DB.prepare(
    `SELECT a.id, a.prenom, a.nom, a.date_naissance, a.sexe, a.grade, a.ville, a.supprime_le,
            u.id AS r_id, u.prenom AS r_prenom, u.nom AS r_nom
     FROM adherents a
     LEFT JOIN liens l ON l.adherent_id = a.id
     LEFT JOIN users u ON u.id = l.user_id AND u.supprime_le IS NULL
     WHERE (a.supprime_le IS NULL OR ?1 = 1)
       AND lower(a.prenom || ' ' || a.nom || ' ' || a.nom || ' ' || a.prenom) LIKE ?2
     ORDER BY a.nom, a.prenom, a.id
     LIMIT 2000`,
  )
    .bind(avecSupprimes, recherche(c.req.query('q')))
    .all<AdherentLigne>();

  // Une ligne par couple adhérent × responsable → un adhérent avec la liste de ses responsables.
  type AdherentListe = Omit<AdherentLigne, 'r_id' | 'r_prenom' | 'r_nom'> & {
    responsables: { id: number; prenom: string; nom: string }[];
  };
  const parId = new Map<number, AdherentListe>();
  for (const { r_id, r_prenom, r_nom, ...a } of results) {
    let courant = parId.get(a.id);
    if (!courant) {
      courant = { ...a, responsables: [] };
      parId.set(a.id, courant);
    }
    if (r_id && r_prenom && r_nom) courant.responsables.push({ id: r_id, prenom: r_prenom, nom: r_nom });
  }
  return c.json([...parId.values()]);
});

admin.post('/adherents', async (c) => {
  const r = validerAdherent((await corps(c)) ?? {});
  if (!r.ok) return invalide(c, r);
  const a = r.valeur;
  const cree = await c.env.DB.prepare(
    `INSERT INTO adherents (prenom, nom, date_naissance, sexe, grade, numero_licence, adresse, code_postal, ville)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`,
  )
    .bind(a.prenom, a.nom, a.date_naissance, a.sexe, a.grade, a.numero_licence, a.adresse, a.code_postal, a.ville)
    .first<{ id: number }>();
  return c.json({ id: cree?.id }, 201);
});

admin.get('/adherents/:id', async (c) => {
  const adherentId = id(c, 'id');
  if (!adherentId) return c.json({ error: 'Adhérent introuvable' }, 404);
  const adherent = await c.env.DB.prepare(
    `SELECT id, prenom, nom, date_naissance, sexe, grade, numero_licence, adresse, code_postal, ville,
            user_id, created_at, updated_at, supprime_le
     FROM adherents WHERE id = ?`,
  )
    .bind(adherentId)
    .first();
  if (!adherent) return c.json({ error: 'Adhérent introuvable' }, 404);

  const [responsables, personnes] = await c.env.DB.batch([
    c.env.DB.prepare(
      `SELECT u.id, u.prenom, u.nom, u.email, u.telephone, l.qualite, l.peut_inscrire, l.peut_recuperer, l.est_contact,
              EXISTS (SELECT 1 FROM identites i WHERE i.user_id = u.id) AS compte_active
       FROM liens l JOIN users u ON u.id = l.user_id
       WHERE l.adherent_id = ? AND u.supprime_le IS NULL
       ORDER BY u.nom, u.prenom`,
    ).bind(adherentId),
    c.env.DB.prepare(
      `SELECT id, prenom, nom, lien, telephone FROM personnes_autorisees WHERE adherent_id = ? ORDER BY nom, prenom`,
    ).bind(adherentId),
  ]);
  return c.json({ adherent, responsables: responsables?.results ?? [], personnesAutorisees: personnes?.results ?? [] });
});

admin.put('/adherents/:id', async (c) => {
  const adherentId = id(c, 'id');
  const r = validerAdherent((await corps(c)) ?? {});
  if (!r.ok) return invalide(c, r);
  const a = r.valeur;
  const res = await c.env.DB.prepare(
    `UPDATE adherents SET prenom = ?, nom = ?, date_naissance = ?, sexe = ?, grade = ?, numero_licence = ?,
            adresse = ?, code_postal = ?, ville = ?, updated_at = datetime('now')
     WHERE id = ? AND supprime_le IS NULL`,
  )
    .bind(a.prenom, a.nom, a.date_naissance, a.sexe, a.grade, a.numero_licence, a.adresse, a.code_postal, a.ville, adherentId)
    .run();
  if (!res.meta.changes) return c.json({ error: 'Adhérent introuvable' }, 404);
  return c.json({ ok: true });
});

admin.delete('/adherents/:id', async (c) => {
  const res = await c.env.DB.prepare(
    "UPDATE adherents SET supprime_le = datetime('now') WHERE id = ? AND supprime_le IS NULL",
  )
    .bind(id(c, 'id'))
    .run();
  if (!res.meta.changes) return c.json({ error: 'Adhérent introuvable' }, 404);
  return c.json({ ok: true });
});

admin.post('/adherents/:id/restaurer', async (c) => {
  const res = await c.env.DB.prepare(
    'UPDATE adherents SET supprime_le = NULL WHERE id = ? AND supprime_le IS NOT NULL',
  )
    .bind(id(c, 'id'))
    .run();
  if (!res.meta.changes) return c.json({ error: 'Adhérent introuvable' }, 404);
  return c.json({ ok: true });
});

async function adherentActif(c: Context<AppEnv>, adherentId: number | null): Promise<boolean> {
  if (!adherentId) return false;
  return !!(await c.env.DB.prepare('SELECT 1 FROM adherents WHERE id = ? AND supprime_le IS NULL').bind(adherentId).first());
}

// --- Responsables légaux (liens) ---

admin.put('/adherents/:id/responsables/:userId', async (c) => {
  const adherentId = id(c, 'id');
  const userId = id(c, 'userId');
  const r = validerLien((await corps(c)) ?? {});
  if (!r.ok) return invalide(c, r);
  if (!(await adherentActif(c, adherentId))) return c.json({ error: 'Adhérent introuvable' }, 404);
  const compte = await c.env.DB.prepare('SELECT 1 FROM users WHERE id = ? AND supprime_le IS NULL').bind(userId).first();
  if (!compte) return c.json({ error: 'Compte introuvable' }, 404);
  const l = r.valeur;
  await c.env.DB.prepare(
    `INSERT INTO liens (user_id, adherent_id, qualite, peut_inscrire, peut_recuperer, est_contact)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT (user_id, adherent_id) DO UPDATE SET qualite = excluded.qualite,
       peut_inscrire = excluded.peut_inscrire, peut_recuperer = excluded.peut_recuperer, est_contact = excluded.est_contact`,
  )
    .bind(userId, adherentId, l.qualite, l.peut_inscrire, l.peut_recuperer, l.est_contact)
    .run();
  return c.json({ ok: true });
});

admin.delete('/adherents/:id/responsables/:userId', async (c) => {
  const res = await c.env.DB.prepare('DELETE FROM liens WHERE adherent_id = ? AND user_id = ?')
    .bind(id(c, 'id'), id(c, 'userId'))
    .run();
  if (!res.meta.changes) return c.json({ error: 'Lien introuvable' }, 404);
  return c.json({ ok: true });
});

// --- Personnes autorisées à récupérer l'enfant ---

admin.post('/adherents/:id/personnes-autorisees', async (c) => {
  const adherentId = id(c, 'id');
  const r = validerPersonneAutorisee((await corps(c)) ?? {});
  if (!r.ok) return invalide(c, r);
  if (!(await adherentActif(c, adherentId))) return c.json({ error: 'Adhérent introuvable' }, 404);
  const p = r.valeur;
  const cree = await c.env.DB.prepare(
    'INSERT INTO personnes_autorisees (adherent_id, prenom, nom, lien, telephone) VALUES (?, ?, ?, ?, ?) RETURNING id',
  )
    .bind(adherentId, p.prenom, p.nom, p.lien, p.telephone)
    .first<{ id: number }>();
  return c.json({ id: cree?.id }, 201);
});

admin.delete('/adherents/:id/personnes-autorisees/:pid', async (c) => {
  const res = await c.env.DB.prepare('DELETE FROM personnes_autorisees WHERE id = ? AND adherent_id = ?')
    .bind(id(c, 'pid'), id(c, 'id'))
    .run();
  if (!res.meta.changes) return c.json({ error: 'Personne introuvable' }, 404);
  return c.json({ ok: true });
});

// --- Comptes (responsables légaux, adhérents majeurs, bureau) ---

type CompteLigne = {
  id: number;
  prenom: string;
  nom: string;
  email: string | null;
  telephone: string | null;
  last_login: string | null;
  roles: string | null;
  compte_active: number;
  enfants: number;
  sessions: number;
};

admin.get('/comptes', async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT u.id, u.prenom, u.nom, u.email, u.telephone, u.last_login,
            (SELECT group_concat(role) FROM user_roles r WHERE r.user_id = u.id) AS roles,
            EXISTS (SELECT 1 FROM identites i WHERE i.user_id = u.id) AS compte_active,
            (SELECT count(*) FROM liens l JOIN adherents a ON a.id = l.adherent_id
              WHERE l.user_id = u.id AND a.supprime_le IS NULL) AS enfants,
            (SELECT count(*) FROM sessions s WHERE s.user_id = u.id AND s.expire_le > datetime('now')) AS sessions
     FROM users u
     WHERE u.supprime_le IS NULL
       AND lower(u.prenom || ' ' || u.nom || ' ' || u.nom || ' ' || coalesce(u.email, '')) LIKE ?
     ORDER BY u.nom, u.prenom
     LIMIT 2000`,
  )
    .bind(recherche(c.req.query('q')))
    .all<CompteLigne>();
  return c.json(results.map((r) => ({ ...r, roles: r.roles ? r.roles.split(',').sort() : [], compte_active: !!r.compte_active })));
});

async function emailPris(c: Context<AppEnv>, email: string | null, saufId: number | null): Promise<{ id: number } | null> {
  if (!email) return null;
  return c.env.DB.prepare('SELECT id FROM users WHERE email = ? AND id IS NOT ?').bind(email, saufId).first<{ id: number }>();
}

admin.post('/comptes', async (c) => {
  const r = validerCompte((await corps(c)) ?? {});
  if (!r.ok) return invalide(c, r);
  const u = r.valeur;
  const existant = await emailPris(c, u.email, null);
  if (existant) return c.json({ error: 'Un compte existe déjà avec cet e-mail', erreurs: { email: 'Déjà utilisé' }, id: existant.id }, 409);
  const cree = await c.env.DB.prepare('INSERT INTO users (prenom, nom, email, telephone) VALUES (?, ?, ?, ?) RETURNING id')
    .bind(u.prenom, u.nom, u.email, u.telephone)
    .first<{ id: number }>();
  return c.json({ id: cree?.id }, 201);
});

admin.put('/comptes/:id', async (c) => {
  const compteId = id(c, 'id');
  const r = validerCompte((await corps(c)) ?? {});
  if (!r.ok) return invalide(c, r);
  const u = r.valeur;
  if (await emailPris(c, u.email, compteId)) return c.json({ error: 'Un compte existe déjà avec cet e-mail', erreurs: { email: 'Déjà utilisé' } }, 409);
  const res = await c.env.DB.prepare('UPDATE users SET prenom = ?, nom = ?, email = ?, telephone = ? WHERE id = ? AND supprime_le IS NULL')
    .bind(u.prenom, u.nom, u.email, u.telephone, compteId)
    .run();
  if (!res.meta.changes) return c.json({ error: 'Compte introuvable' }, 404);
  return c.json({ ok: true });
});

async function nombreAdmins(c: Context<AppEnv>, sauf: number | null): Promise<number> {
  const r = await c.env.DB.prepare(
    `SELECT count(*) AS n FROM user_roles r JOIN users u ON u.id = r.user_id
     WHERE r.role = 'admin' AND u.supprime_le IS NULL AND u.id IS NOT ?`,
  )
    .bind(sauf)
    .first<{ n: number }>();
  return r?.n ?? 0;
}

admin.put('/comptes/:id/roles', roleRequis('admin'), async (c) => {
  const compteId = id(c, 'id');
  const b = await corps(c);
  const roles = Array.isArray(b?.roles) ? [...new Set(b.roles)] : null;
  if (!roles || !roles.every((r): r is Role => ROLES.includes(r as Role))) {
    return c.json({ error: 'Saisie invalide', erreurs: { roles: 'Rôle inconnu' } }, 400);
  }
  const compte = await c.env.DB.prepare('SELECT 1 FROM users WHERE id = ? AND supprime_le IS NULL').bind(compteId).first();
  if (!compte) return c.json({ error: 'Compte introuvable' }, 404);
  if (!roles.includes('admin') && (await nombreAdmins(c, compteId)) === 0) {
    return c.json({ error: 'Il faut garder au moins un administrateur' }, 409);
  }
  await c.env.DB.batch([
    c.env.DB.prepare('DELETE FROM user_roles WHERE user_id = ?').bind(compteId),
    ...roles.map((r) => c.env.DB.prepare('INSERT INTO user_roles (user_id, role) VALUES (?, ?)').bind(compteId, r)),
  ]);
  return c.json({ ok: true });
});

admin.delete('/comptes/:id', async (c) => {
  const compteId = id(c, 'id');
  if (compteId === c.get('utilisateur').id) return c.json({ error: 'Impossible de supprimer son propre compte' }, 409);
  const estAdmin = await c.env.DB.prepare("SELECT 1 FROM user_roles WHERE user_id = ? AND role = 'admin'").bind(compteId).first();
  if (estAdmin && (await nombreAdmins(c, compteId)) === 0) {
    return c.json({ error: 'Il faut garder au moins un administrateur' }, 409);
  }
  const [res] = await c.env.DB.batch([
    c.env.DB.prepare("UPDATE users SET supprime_le = datetime('now') WHERE id = ? AND supprime_le IS NULL").bind(compteId),
    ...couperAcces(c.env, compteId as number),
  ]);
  if (!res?.meta.changes) return c.json({ error: 'Compte introuvable' }, 404);
  return c.json({ ok: true });
});

// --- Connexion des comptes (spec 005a) ---

// Lien de connexion personnel, à remettre par WhatsApp. Il connecte À LA PLACE de la personne :
// seul un administrateur en crée pour un compte qui a un rôle (sinon un membre du bureau pourrait
// se connecter comme administrateur). Le créateur est enregistré.
admin.post('/comptes/:id/lien', async (c) => {
  const compteId = id(c, 'id');
  const compte = await c.env.DB.prepare(
    'SELECT EXISTS (SELECT 1 FROM user_roles r WHERE r.user_id = u.id) AS a_un_role FROM users u WHERE u.id = ? AND u.supprime_le IS NULL',
  )
    .bind(compteId)
    .first<{ a_un_role: number }>();
  if (!compte) return c.json({ error: 'Compte introuvable' }, 404);
  const moi = c.get('utilisateur');
  if (compte.a_un_role && !aUnRole(moi, ['admin'])) {
    return c.json({ error: 'Seul un administrateur peut créer un lien pour un compte du bureau' }, 403);
  }
  return c.json(await creerLien(c.env, compteId as number, moi.id), 201);
});

// Téléphone perdu, départ du club… : ferme toutes les sessions du compte.
admin.delete('/comptes/:id/sessions', async (c) => {
  const res = await c.env.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(id(c, 'id')).run();
  return c.json({ ok: true, fermees: res.meta.changes });
});

// --- Dossiers d'adhésion (spec 010a) ---
// Le Worker recalcule et FIGE les montants (grille de la saison, content/adhesion.ts) : l'écran
// n'affiche qu'une estimation. Consentements et autorisations : datés, avec qui les a saisis.

type Dossier = {
  formule: string;
  paiement_mode: string | null;
  formalite_recue_le: string | null;
  soins_urgence: Recueil;
  droit_image: Recueil;
  whatsapp: Recueil;
  valide_le: string | null;
} & Record<string, unknown>;

const nombre = (r: D1Result | undefined) => (r?.results[0] as { n: number } | undefined)?.n ?? 0;

async function contexteDossier(c: Context<AppEnv>, adherentId: number) {
  const adherent = await c.env.DB.prepare('SELECT id, date_naissance, code_postal FROM adherents WHERE id = ? AND supprime_le IS NULL')
    .bind(adherentId)
    .first<{ id: number; date_naissance: string; code_postal: string | null }>();
  if (!adherent) return null;
  const [responsables, famille, dossier] = await c.env.DB.batch([
    c.env.DB.prepare(
      'SELECT count(*) AS n FROM liens l JOIN users u ON u.id = l.user_id WHERE l.adherent_id = ? AND u.supprime_le IS NULL',
    ).bind(adherentId),
    // Autres enfants d'un même responsable qui ont déjà un dossier cette saison → réduction famille.
    c.env.DB.prepare(
      `SELECT count(DISTINCT d.adherent_id) AS n
       FROM liens l1 JOIN liens l2 ON l2.user_id = l1.user_id AND l2.adherent_id != l1.adherent_id
       JOIN adhesions d ON d.adherent_id = l2.adherent_id AND d.saison = ?1
       JOIN adherents a ON a.id = d.adherent_id AND a.supprime_le IS NULL
       WHERE l1.adherent_id = ?2`,
    ).bind(SAISON.id, adherentId),
    c.env.DB.prepare('SELECT * FROM adhesions WHERE adherent_id = ? AND saison = ?').bind(adherentId, SAISON.id),
  ]);
  const contexte = {
    mineur: estMineur(adherent.date_naissance),
    responsables: nombre(responsables),
    autresDossiersFamille: nombre(famille),
    horsCommune: horsCommuneSuggere(adherent.code_postal),
    formuleJudo: formuleJudoSuggeree(Number(adherent.date_naissance.slice(0, 4))),
  };
  const adhesion = (dossier?.results[0] as Dossier | undefined) ?? null;
  return { saison: SAISON, contexte, adhesion, etat: adhesion ? etatDossier(adhesion, contexte) : null };
}

admin.get('/adherents/:id/adhesion', async (c) => {
  const r = await contexteDossier(c, id(c, 'id') ?? 0);
  return r ? c.json(r) : c.json({ error: 'Adhérent introuvable' }, 404);
});

admin.put('/adherents/:id/adhesion', async (c) => {
  const adherentId = id(c, 'id') ?? 0;
  const r = validerAdhesion((await corps(c)) ?? {});
  if (!r.ok) return invalide(c, r);
  const avant = await contexteDossier(c, adherentId);
  if (!avant) return c.json({ error: 'Adhérent introuvable' }, 404);
  const s = r.valeur;
  const m = calculerMontant({ formule: s.formule, passeport: !!s.passeport, horsCommune: !!s.hors_commune, reductionFamille: !!s.reduction_famille });
  if (!m) return c.json({ error: 'Saisie invalide', erreurs: { formule: 'Formule inconnue' } }, 400);
  const moi = c.get('utilisateur').id;
  // Consentement / autorisation : date et auteur mis à jour quand la réponse change.
  const trace = (champ: 'soins_urgence' | 'droit_image' | 'whatsapp'): [unknown, unknown] => {
    if (avant.adhesion?.[champ] === s[champ]) return [avant.adhesion[`${champ}_le`] ?? null, avant.adhesion[`${champ}_par`] ?? null];
    return s[champ] === 'non_recueilli' ? [null, null] : [new Date().toISOString().slice(0, 19).replace('T', ' '), moi];
  };
  const [soinsLe, soinsPar] = trace('soins_urgence');
  const [imageLe, imagePar] = trace('droit_image');
  const [whatsappLe, whatsappPar] = trace('whatsapp');
  // Toute modification annule la validation : le bureau revalide un dossier modifié.
  await c.env.DB.prepare(
    `INSERT INTO adhesions (adherent_id, saison, formule, passeport, hors_commune, reduction_famille,
       montant_participation, montant_licence, montant_supplements, montant_reduction, montant_total,
       paiement_mode, paiement_3_fois, echeance_1, echeance_2, echeance_3, formalite_type, formalite_recue_le,
       soins_urgence, soins_urgence_le, soins_urgence_par, droit_image, droit_image_le, droit_image_par,
       whatsapp, whatsapp_le, whatsapp_par, cree_par)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18, ?19, ?20, ?21, ?22, ?23, ?24, ?25, ?26, ?27, ?28)
     ON CONFLICT (adherent_id, saison) DO UPDATE SET
       formule = excluded.formule, passeport = excluded.passeport, hors_commune = excluded.hors_commune,
       reduction_famille = excluded.reduction_famille, montant_participation = excluded.montant_participation,
       montant_licence = excluded.montant_licence, montant_supplements = excluded.montant_supplements,
       montant_reduction = excluded.montant_reduction, montant_total = excluded.montant_total,
       paiement_mode = excluded.paiement_mode, paiement_3_fois = excluded.paiement_3_fois,
       echeance_1 = excluded.echeance_1, echeance_2 = excluded.echeance_2, echeance_3 = excluded.echeance_3,
       formalite_type = excluded.formalite_type, formalite_recue_le = excluded.formalite_recue_le,
       soins_urgence = excluded.soins_urgence, soins_urgence_le = excluded.soins_urgence_le, soins_urgence_par = excluded.soins_urgence_par,
       droit_image = excluded.droit_image, droit_image_le = excluded.droit_image_le, droit_image_par = excluded.droit_image_par,
       whatsapp = excluded.whatsapp, whatsapp_le = excluded.whatsapp_le, whatsapp_par = excluded.whatsapp_par,
       valide_le = NULL, valide_par = NULL, updated_at = datetime('now')`,
  )
    .bind(
      adherentId, SAISON.id, s.formule, s.passeport, s.hors_commune, s.reduction_famille,
      m.participation, m.licence, m.supplements, m.reduction, m.total,
      s.paiement_mode, s.paiement_3_fois, m.echeancier[0], m.echeancier[1], m.echeancier[2],
      s.formalite_type, s.formalite_recue_le,
      s.soins_urgence, soinsLe, soinsPar, s.droit_image, imageLe, imagePar, s.whatsapp, whatsappLe, whatsappPar, moi,
    )
    .run();
  return c.json(await contexteDossier(c, adherentId));
});

admin.post('/adherents/:id/adhesion/valider', async (c) => {
  const adherentId = id(c, 'id') ?? 0;
  const r = await contexteDossier(c, adherentId);
  if (!r?.adhesion || !r.etat) return c.json({ error: 'Dossier introuvable' }, 404);
  if (r.etat.manques.length) return c.json({ error: `Dossier incomplet : ${r.etat.manques.join(', ')}` }, 409);
  await c.env.DB.prepare("UPDATE adhesions SET valide_le = datetime('now'), valide_par = ? WHERE adherent_id = ? AND saison = ?")
    .bind(c.get('utilisateur').id, adherentId, SAISON.id)
    .run();
  return c.json(await contexteDossier(c, adherentId));
});

admin.delete('/adherents/:id/adhesion', async (c) => {
  const res = await c.env.DB.prepare('DELETE FROM adhesions WHERE adherent_id = ? AND saison = ?').bind(id(c, 'id'), SAISON.id).run();
  if (!res.meta.changes) return c.json({ error: 'Dossier introuvable' }, 404);
  return c.json({ ok: true });
});

type LigneDossiers = {
  id: number;
  prenom: string;
  nom: string;
  date_naissance: string;
  responsables: number;
  formule: string | null;
  montant_total: number | null;
  paiement_mode: string | null;
  formalite_recue_le: string | null;
  soins_urgence: Recueil | null;
  droit_image: Recueil | null;
  whatsapp: Recueil | null;
  valide_le: string | null;
};

// Tous les adhérents actifs, avec leur dossier de la saison s'il existe (« sans dossier » sinon).
admin.get('/adhesions', async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT a.id, a.prenom, a.nom, a.date_naissance,
            (SELECT count(*) FROM liens l JOIN users u ON u.id = l.user_id WHERE l.adherent_id = a.id AND u.supprime_le IS NULL) AS responsables,
            d.formule, d.montant_total, d.paiement_mode, d.formalite_recue_le, d.soins_urgence, d.droit_image, d.whatsapp, d.valide_le
     FROM adherents a LEFT JOIN adhesions d ON d.adherent_id = a.id AND d.saison = ?
     WHERE a.supprime_le IS NULL
     ORDER BY a.nom, a.prenom`,
  )
    .bind(SAISON.id)
    .all<LigneDossiers>();
  const lignes = results.map((l) => ({
    adherent: { id: l.id, prenom: l.prenom, nom: l.nom, date_naissance: l.date_naissance },
    dossier: l.formule ? { formule: l.formule, montant_total: l.montant_total ?? 0 } : null,
    etat: l.formule
      ? etatDossier(
          {
            paiement_mode: l.paiement_mode,
            formalite_recue_le: l.formalite_recue_le,
            soins_urgence: l.soins_urgence ?? 'non_recueilli',
            droit_image: l.droit_image ?? 'non_recueilli',
            whatsapp: l.whatsapp ?? 'non_recueilli',
            valide_le: l.valide_le,
          },
          { mineur: estMineur(l.date_naissance), responsables: l.responsables },
        )
      : null,
  }));
  return c.json({ saison: SAISON, lignes });
});
