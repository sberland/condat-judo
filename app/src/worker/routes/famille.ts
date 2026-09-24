// Espace famille (spec 004) — tout compte connecté. Un responsable ne voit QUE les adhérents
// auxquels il est lié (filtre sur `liens.user_id` = lui-même, côté SQL). v1 : consultation, et mise
// à jour de son propre téléphone ; la modification des fiches enfants viendra avec la spec 010.
import { Hono } from 'hono';
import { connexionRequise, type AppEnv } from '../droits';
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

  // Co-responsables et personnes autorisées des seuls enfants de ce responsable.
  const [coResponsables, personnes] = await c.env.DB.batch([
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
  ]);
  type Co = { adherent_id: number; prenom: string; nom: string; qualite: string };
  type Pa = { adherent_id: number; prenom: string; nom: string; lien: string };
  const co = (coResponsables?.results ?? []) as Co[];
  const pa = (personnes?.results ?? []) as Pa[];

  return c.json(
    enfants.map((e) => ({
      ...e,
      coResponsables: co.filter((r) => r.adherent_id === e.id).map(({ prenom, nom, qualite }) => ({ prenom, nom, qualite })),
      personnesAutorisees: pa.filter((p) => p.adherent_id === e.id).map(({ prenom, nom, lien }) => ({ prenom, nom, lien })),
    })),
  );
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
