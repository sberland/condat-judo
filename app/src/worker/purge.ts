// Purge RGPD (spec 019) — au-delà de la durée de conservation décidée par le club (N saisons après
// la dernière adhésion), un adhérent est rendu anonyme, ainsi que ses responsables qui n'ont plus
// d'autre enfant au club. Exécutée chaque semaine par la tâche planifiée du Worker (prod), en un
// seul lot D1 (transaction) ; les mêmes instructions sont testées sur SQLite (purge.test.ts).
//
// Ce qui est gardé : montants des dossiers et paiements (comptabilité), inscriptions aux
// compétitions, année de naissance et sexe (statistiques) — rattachés à un adhérent anonyme.
import { RGPD } from '../../web/src/content/rgpd';
import type { Env } from './env';

/** Année de début de la saison en cours (saison = septembre → août). */
export function debutSaison(jour: string): number {
  const [annee = 0, mois = 0] = jour.split('-').map(Number);
  return mois >= 9 ? annee : annee - 1;
}

/** Anonymisés : adhérents dont la dernière saison a commencé avant cette année. */
export const seuilPurge = (jour: string, saisons: number) => debutSaison(jour) - saisons;

/** Dernière saison d'un adhérent : son dernier dossier, sinon la saison où sa fiche a été créée. */
export const DERNIERE_SAISON = `COALESCE(
  (SELECT max(CAST(substr(d.saison, 1, 4) AS INTEGER)) FROM adhesions d WHERE d.adherent_id = adherents.id),
  CAST(strftime('%Y', adherents.created_at) AS INTEGER) - (CAST(strftime('%m', adherents.created_at) AS INTEGER) < 9))`;

/** Adhérents à anonymiser pour un seuil (paramètre `?${n}`) ; jamais un membre qui a un rôle au club. */
export const critere = (n: number) => `adherents.anonymise_le IS NULL
  AND NOT (adherents.user_id IS NOT NULL AND EXISTS (SELECT 1 FROM user_roles r WHERE r.user_id = adherents.user_id))
  AND ${DERNIERE_SAISON} < ?${n}`;

const ADHERENTS_DU_LOT = 'SELECT id FROM adherents WHERE anonymise_le = ?1';

export type Instruction = { sql: string; params: (string | number)[] };

/**
 * Durées techniques, appliquées chaque semaine même tant que la durée de conservation des
 * adhérents attend la réponse du club : journal des accès, demandes de garderie, photos et
 * inscriptions des familles aux événements (1 an),
 * sessions et liens de connexion expirés.
 */
export function instructionsDurees(maintenant: string): Instruction[] {
  const lot = (sql: string): Instruction => ({ sql, params: [maintenant] });
  return [
    lot("DELETE FROM journal_acces WHERE cree_le < datetime(?1, '-1 year')"),
    lot("DELETE FROM garderie_demandes WHERE date < date(?1, '-1 year')"),
    lot("DELETE FROM photos_adherents WHERE deposee_le < datetime(?1, '-1 year')"),
    lot("DELETE FROM inscriptions_famille WHERE competition_id IN (SELECT id FROM competitions WHERE date < date(?1, '-1 year'))"),
    lot('DELETE FROM sessions WHERE expire_le < ?1'),
    lot('DELETE FROM liens_connexion WHERE expire_le < ?1'),
    lot('DELETE FROM defis_passkey WHERE expire_le < ?1'),
  ];
}

/**
 * Instructions de la purge, dans l'ordre. `maintenant` (AAAA-MM-JJ HH:MM:SS) marque le lot : les
 * lignes anonymisées par ce passage portent cette date dans `anonymise_le`.
 */
export function instructionsPurge(maintenant: string, seuil: number): Instruction[] {
  const lot = (sql: string): Instruction => ({ sql, params: [maintenant] });
  return [
    // 1. Marquer les adhérents arrivés à échéance.
    { sql: `UPDATE adherents SET anonymise_le = ?1 WHERE ${critere(2)}`, params: [maintenant, seuil] },
    // 2. Marquer leurs responsables (et comptes d'adhérents majeurs) qui n'ont plus d'autre adhérent actif.
    lot(`UPDATE users SET anonymise_le = ?1
      WHERE anonymise_le IS NULL
        AND NOT EXISTS (SELECT 1 FROM user_roles r WHERE r.user_id = users.id)
        AND (EXISTS (SELECT 1 FROM liens l WHERE l.user_id = users.id AND l.adherent_id IN (${ADHERENTS_DU_LOT}))
          OR EXISTS (SELECT 1 FROM adherents a WHERE a.user_id = users.id AND a.anonymise_le = ?1))
        AND NOT EXISTS (SELECT 1 FROM liens l JOIN adherents a ON a.id = l.adherent_id WHERE l.user_id = users.id AND a.anonymise_le IS NULL)
        AND NOT EXISTS (SELECT 1 FROM adherents a WHERE a.user_id = users.id AND a.anonymise_le IS NULL)`),
    // 3. Effacer ce qui n'a plus de raison d'être.
    lot(`DELETE FROM personnes_autorisees WHERE adherent_id IN (${ADHERENTS_DU_LOT})`),
    lot(`DELETE FROM liens WHERE adherent_id IN (${ADHERENTS_DU_LOT})`),
    lot(`DELETE FROM garderie_demandes WHERE adherent_id IN (${ADHERENTS_DU_LOT})`),
    lot(`DELETE FROM photos_adherents WHERE adherent_id IN (${ADHERENTS_DU_LOT})`),
    lot(`UPDATE adhesions SET
        soins_urgence = 'non_recueilli', soins_urgence_le = NULL, soins_urgence_par = NULL,
        droit_image = 'non_recueilli', droit_image_le = NULL, droit_image_par = NULL,
        whatsapp = 'non_recueilli', whatsapp_le = NULL, whatsapp_par = NULL,
        photo_garderie = 'non_recueilli', photo_garderie_le = NULL, photo_garderie_par = NULL
      WHERE adherent_id IN (${ADHERENTS_DU_LOT})`),
    lot(`UPDATE paiements SET reference = NULL WHERE id IN (
        SELECT pp.paiement_id FROM paiement_parts pp JOIN adhesions d ON d.id = pp.adhesion_id WHERE d.adherent_id IN (${ADHERENTS_DU_LOT}))`),
    // 4. Rendre anonymes les fiches et les comptes du lot.
    lot(`UPDATE adherents SET prenom = 'Ancien adhérent', nom = printf('n° %d', id),
        date_naissance = substr(date_naissance, 1, 4) || '-01-01',
        numero_licence = NULL, adresse = NULL, code_postal = NULL, ville = NULL, user_id = NULL,
        supprime_le = COALESCE(supprime_le, ?1)
      WHERE anonymise_le = ?1`),
    lot('DELETE FROM identites WHERE user_id IN (SELECT id FROM users WHERE anonymise_le = ?1)'),
    lot('DELETE FROM sessions WHERE user_id IN (SELECT id FROM users WHERE anonymise_le = ?1)'),
    lot('DELETE FROM passkeys WHERE user_id IN (SELECT id FROM users WHERE anonymise_le = ?1)'),
    lot('DELETE FROM inscriptions_famille WHERE user_id IN (SELECT id FROM users WHERE anonymise_le = ?1)'),
    lot('DELETE FROM liens_connexion WHERE user_id IN (SELECT id FROM users WHERE anonymise_le = ?1)'),
    lot(`UPDATE users SET prenom = 'Ancien', nom = printf('responsable n° %d', id), email = NULL, telephone = NULL,
        supprime_le = COALESCE(supprime_le, ?1)
      WHERE anonymise_le = ?1`),
    // 5. Durées techniques.
    ...instructionsDurees(maintenant),
    // 6. Rapport.
    {
      sql: `INSERT INTO purges (execute_le, seuil, adherents, comptes) VALUES (?1, ?2,
        (SELECT count(*) FROM adherents WHERE anonymise_le = ?1), (SELECT count(*) FROM users WHERE anonymise_le = ?1))`,
      params: [maintenant, seuil],
    },
  ];
}

/**
 * Tâche planifiée (wrangler.toml, lundi 3 h UTC) : ne fait rien hors production ; tant que la
 * durée de conservation attend la réponse du club (`provisoire`), seules les durées techniques
 * s'appliquent.
 */
export async function purgerRgpd(env: Env, maintenant = new Date()): Promise<string> {
  if (env.ENVIRONMENT !== 'production') return 'purge ignorée : hors production';
  const { valeur, provisoire } = RGPD.conservationAdherents;
  const jour = maintenant.toLocaleDateString('sv-SE', { timeZone: 'Europe/Paris' });
  const horodatage = maintenant.toISOString().slice(0, 19).replace('T', ' ');
  if (provisoire) {
    await env.DB.batch(instructionsDurees(horodatage).map(({ sql, params }) => env.DB.prepare(sql).bind(...params)));
    return 'durées techniques appliquées ; anonymisation en attente de la durée de conservation confirmée par le club';
  }
  await env.DB.batch(instructionsPurge(horodatage, seuilPurge(jour, valeur)).map(({ sql, params }) => env.DB.prepare(sql).bind(...params)));
  return 'purge effectuée';
}
