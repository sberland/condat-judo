// Export des données d'un compte (spec 019, droits d'accès et à la portabilité) : le compte, et
// pour chaque adhérent lié (ses enfants, ou lui-même s'il est adhérent) : fiche, responsables,
// personnes autorisées, dossiers et versements, événements, garderie (demandes, photo). Fichier
// JSON aux clés lisibles. Pas d'identifiant technique inutile, jamais la référence d'un chèque
// (elle peut être celle d'un autre responsable) ni les coordonnées des autres responsables.
import type { Env } from './env';

type Ligne = Record<string, unknown>;

export async function donneesDuCompte(env: Env, userId: number): Promise<Ligne | null> {
  const compte = await env.DB.prepare('SELECT prenom, nom, email, telephone, created_at, last_login FROM users WHERE id = ? AND anonymise_le IS NULL')
    .bind(userId)
    .first<Ligne>();
  if (!compte) return null;

  const [roles, identites, sessions, adherents, evenements, passkeys] = await env.DB.batch([
    env.DB.prepare('SELECT role FROM user_roles WHERE user_id = ?').bind(userId),
    env.DB.prepare('SELECT provider, created_at, last_seen FROM identites WHERE user_id = ?').bind(userId),
    env.DB.prepare('SELECT created_at, expire_le FROM sessions WHERE user_id = ?').bind(userId),
    env.DB.prepare(
      `SELECT a.id, a.prenom, a.nom, a.date_naissance, a.sexe, a.grade, a.numero_licence, a.adresse, a.code_postal, a.ville,
              a.created_at, l.qualite, l.peut_inscrire, l.peut_recuperer, l.est_contact
       FROM adherents a LEFT JOIN liens l ON l.adherent_id = a.id AND l.user_id = ?1
       WHERE a.anonymise_le IS NULL AND (l.user_id IS NOT NULL OR a.user_id = ?1)`,
    ).bind(userId),
    env.DB.prepare(
      `SELECT co.nom, co.date, f.adultes, f.enfants, f.inscrit_le FROM inscriptions_famille f JOIN competitions co ON co.id = f.competition_id
       WHERE f.user_id = ? ORDER BY co.date`,
    ).bind(userId),
    env.DB.prepare('SELECT appareil, created_at, derniere_utilisation FROM passkeys WHERE user_id = ?').bind(userId),
  ]);

  const enfants: Ligne[] = [];
  for (const a of (adherents?.results ?? []) as Ligne[]) {
    const [co, pa, dossiers, versements, competitions, garderie, photo] = await env.DB.batch([
      env.DB.prepare(
        `SELECT u.prenom, u.nom, l.qualite FROM liens l JOIN users u ON u.id = l.user_id
         WHERE l.adherent_id = ? AND l.user_id != ? AND u.supprime_le IS NULL`,
      ).bind(a.id, userId),
      env.DB.prepare('SELECT prenom, nom, lien FROM personnes_autorisees WHERE adherent_id = ?').bind(a.id),
      env.DB.prepare(
        `SELECT saison, formule, passeport, hors_commune, reduction_famille, montant_total, paiement_mode, paiement_3_fois,
                echeance_1, echeance_2, echeance_3, formalite_type, formalite_recue_le, soins_urgence, soins_urgence_le,
                droit_image, droit_image_le, whatsapp, whatsapp_le, photo_garderie, photo_garderie_le, valide_le, created_at
         FROM adhesions WHERE adherent_id = ? ORDER BY saison`,
      ).bind(a.id),
      env.DB.prepare(
        `SELECT d.saison, p.recu_le, p.mode, pp.montant, p.encaisser_le, p.encaisse_le
         FROM paiement_parts pp JOIN paiements p ON p.id = pp.paiement_id JOIN adhesions d ON d.id = pp.adhesion_id
         WHERE d.adherent_id = ? ORDER BY p.recu_le`,
      ).bind(a.id),
      env.DB.prepare(
        `SELECT co.nom, co.date, co.lieu, i.inscrit_le FROM inscriptions_competition i JOIN competitions co ON co.id = i.competition_id
         WHERE i.adherent_id = ? ORDER BY co.date`,
      ).bind(a.id),
      env.DB.prepare('SELECT date, lieu, demande_le FROM garderie_demandes WHERE adherent_id = ? ORDER BY date').bind(a.id),
      env.DB.prepare('SELECT type, image, deposee_le FROM photos_adherents WHERE adherent_id = ?').bind(a.id),
    ]);
    const p = photo?.results[0] as { type: string; image: string; deposee_le: string } | undefined;
    const { id: _, qualite, peut_inscrire, peut_recuperer, est_contact, ...fiche } = a;
    enfants.push({
      fiche,
      votre_lien:
        qualite === null || qualite === undefined
          ? 'vous-même'
          : { qualite, peut_inscrire: !!peut_inscrire, peut_recuperer: !!peut_recuperer, prevenu_par_le_club: !!est_contact },
      autres_responsables: co?.results ?? [],
      personnes_autorisees: pa?.results ?? [],
      dossiers_adhesion: dossiers?.results ?? [],
      versements: versements?.results ?? [],
      evenements: competitions?.results ?? [],
      garderie_demandes: garderie?.results ?? [],
      photo_garderie: p ? { deposee_le: p.deposee_le, image: `data:${p.type};base64,${p.image}` } : null,
    });
  }

  return {
    genere_le: new Date().toISOString(),
    avertissement: 'Données enregistrées par le club Judo Condat-sur-Vienne à votre sujet et au sujet des adhérents qui vous sont liés.',
    compte: {
      ...compte,
      roles: ((roles?.results ?? []) as { role: string }[]).map((r) => r.role),
      connexions: identites?.results ?? [],
      sessions_ouvertes: sessions?.results ?? [],
      passkeys: passkeys?.results ?? [],
      inscriptions_famille_evenements: evenements?.results ?? [],
    },
    adherents: enfants,
  };
}
