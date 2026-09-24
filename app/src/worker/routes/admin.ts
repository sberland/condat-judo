// API d'administration (spec 004) — réservée aux rôles `bureau` et `admin` ; la gestion des rôles
// est réservée à `admin`. Adhérents, comptes (responsables légaux), liens, personnes autorisées.
import { Hono, type Context } from 'hono';
import { connexionRequise, roleRequis, type AppEnv } from '../droits';
import { ROLES, type Role } from '../identite';
import {
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
};

admin.get('/comptes', async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT u.id, u.prenom, u.nom, u.email, u.telephone, u.last_login,
            (SELECT group_concat(role) FROM user_roles r WHERE r.user_id = u.id) AS roles,
            EXISTS (SELECT 1 FROM identites i WHERE i.user_id = u.id) AS compte_active,
            (SELECT count(*) FROM liens l JOIN adherents a ON a.id = l.adherent_id
              WHERE l.user_id = u.id AND a.supprime_le IS NULL) AS enfants
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
  const res = await c.env.DB.prepare("UPDATE users SET supprime_le = datetime('now') WHERE id = ? AND supprime_le IS NULL")
    .bind(compteId)
    .run();
  if (!res.meta.changes) return c.json({ error: 'Compte introuvable' }, 404);
  return c.json({ ok: true });
});
