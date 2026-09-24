// Purge RGPD (spec 019), exécutée sur une vraie base SQLite (node:sqlite) avec les migrations.
import { readdirSync, readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { critere, instructionsPurge, saisonCourante, seuilPurge } from '../worker/purge';

const migrations = fileURLToPath(new URL('./migrations/', import.meta.url));
const MAINTENANT = '2026-09-28 03:00:00';

// Seuil au 28/09/2026 avec 3 saisons : dernière saison commencée avant 2023 (2022-2023 et avant).
function base(): DatabaseSync {
  const db = new DatabaseSync(':memory:');
  for (const f of readdirSync(migrations).filter((f) => f.endsWith('.sql')).sort()) db.exec(readFileSync(migrations + f, 'utf8'));
  db.exec(`
    INSERT INTO users (id, prenom, nom, email, telephone) VALUES
      (1, 'Alice', 'Bureau', 'alice@club.test', '06 11 11 11 11'),
      (2, 'Paul', 'Ancien', 'paul@famille.test', '06 22 22 22 22'),
      (3, 'Rita', 'Mixte', 'rita@famille.test', '06 33 33 33 33'),
      (4, 'Marc', 'Majeur', 'marc@famille.test', NULL);
    INSERT INTO user_roles (user_id, role) VALUES (1, 'admin');
    INSERT INTO identites (provider, subject, user_id) VALUES ('app', '2', 2), ('app', '3', 3);
    INSERT INTO sessions (empreinte, user_id, expire_le) VALUES ('s2', 2, '2027-01-01 00:00:00'), ('s3', 3, '2027-01-01 00:00:00'), ('vieille', 3, '2026-01-01 00:00:00');
    INSERT INTO adherents (id, prenom, nom, date_naissance, sexe, numero_licence, adresse, code_postal, ville, user_id, created_at) VALUES
      (1, 'Tom', 'Ancien', '2012-03-09', 'M', 'M1', '1 rue Vraie', '87920', 'Condat', NULL, '2020-09-15 10:00:00'),
      (2, 'Léna', 'Mixte', '2014-11-28', 'F', NULL, NULL, NULL, NULL, NULL, '2021-10-01 10:00:00'),
      (3, 'Zoé', 'Actuelle', '2016-05-05', 'F', NULL, NULL, NULL, NULL, NULL, '2024-09-10 10:00:00'),
      (4, 'Marc', 'Majeur', '1980-01-01', 'M', NULL, NULL, NULL, NULL, 4, '2019-09-01 10:00:00'),
      (5, 'Alice', 'Bureau', '1975-01-01', 'F', NULL, NULL, NULL, NULL, 1, '2015-09-01 10:00:00'),
      (6, 'Sam', 'Recent', '2018-01-01', 'M', NULL, NULL, NULL, NULL, NULL, '2023-10-01 10:00:00');
    -- Tom : dernier dossier 2021-2022 → échu. Léna : pas de dossier, fiche créée en 2021-2022 → échue.
    -- Zoé : dossier 2026-2027 → gardée. Marc (majeur, son propre compte) : dernier dossier 2022-2023 → échu.
    -- Alice : membre du bureau → jamais. Sam : fiche créée en 2023-2024 → gardé.
    INSERT INTO liens (user_id, adherent_id, qualite) VALUES (2, 1, 'pere'), (3, 2, 'mere'), (3, 3, 'mere');
    INSERT INTO personnes_autorisees (adherent_id, prenom, nom, lien, telephone) VALUES (1, 'Mamie', 'Vraie', 'grand-mère', '06 55 55 55 55');
    INSERT INTO adhesions (id, adherent_id, saison, formule, montant_participation, montant_licence, montant_supplements, montant_reduction,
      montant_total, echeance_1, echeance_2, echeance_3, droit_image, droit_image_le, droit_image_par) VALUES
      (1, 1, '2021-2022', 'judo-poussins-juniors', 10100, 4600, 0, 0, 14700, 8000, 3400, 3300, 'oui', '2021-09-10', 2),
      (2, 3, '2026-2027', 'judo-poussins-juniors', 10100, 4600, 0, 0, 14700, 8000, 3400, 3300, 'oui', '2026-09-10', 3),
      (3, 4, '2022-2023', 'judo-adulte', 7500, 4600, 0, 0, 12100, 7100, 2500, 2500, 'non_recueilli', NULL, NULL);
    INSERT INTO paiements (id, saison, montant, mode, reference, recu_le) VALUES (1, '2021-2022', 14700, 'cheque', 'Chèque 123 Banque Vraie', '2021-09-10');
    INSERT INTO paiement_parts (paiement_id, adhesion_id, montant) VALUES (1, 1, 14700);
    INSERT INTO journal_acces (cree_le, user_id, action, cible, cible_id) VALUES ('2025-01-01 10:00:00', 1, 'consultation', 'adherent', 1), ('2026-09-01 10:00:00', 1, 'consultation', 'adherent', 3);
  `);
  return db;
}

function purger(db: DatabaseSync, maintenant = MAINTENANT, saisons = 3) {
  for (const { sql, params } of instructionsPurge(maintenant, seuilPurge(maintenant.slice(0, 10), saisons))) db.prepare(sql).run(...params);
}

const ligne = (db: DatabaseSync, sql: string, ...p: (string | number)[]) => db.prepare(sql).get(...p) as Record<string, unknown>;

describe('saisons', () => {
  it('la saison commence en septembre', () => {
    expect(saisonCourante('2026-08-31')).toBe(2025);
    expect(saisonCourante('2026-09-01')).toBe(2026);
    expect(seuilPurge('2026-09-28', 3)).toBe(2023);
  });
});

describe('purge RGPD', () => {
  const db = base();
  const candidats = (db.prepare(`SELECT id FROM adherents WHERE ${critere(1)} ORDER BY id`).all(2023) as { id: number }[]).map((r) => r.id);
  purger(db);

  it('sélectionne les adhérents échus, jamais un membre du bureau', () => {
    expect(candidats).toEqual([1, 2, 4]);
  });

  it('rend anonymes les fiches échues, garde année de naissance et montants', () => {
    expect(ligne(db, 'SELECT prenom, nom, date_naissance, numero_licence, adresse, user_id FROM adherents WHERE id = 1')).toEqual({
      prenom: 'Ancien adhérent',
      nom: 'n° 1',
      date_naissance: '2012-01-01',
      numero_licence: null,
      adresse: null,
      user_id: null,
    });
    expect(ligne(db, 'SELECT montant_total, droit_image, droit_image_par FROM adhesions WHERE id = 1')).toEqual({
      montant_total: 14700,
      droit_image: 'non_recueilli',
      droit_image_par: null,
    });
    expect(ligne(db, 'SELECT reference FROM paiements WHERE id = 1')).toEqual({ reference: null });
    expect(ligne(db, 'SELECT count(*) AS n FROM personnes_autorisees')).toEqual({ n: 0 });
  });

  it('garde les adhérents actifs et le bureau', () => {
    expect(ligne(db, 'SELECT prenom, anonymise_le FROM adherents WHERE id = 3')).toEqual({ prenom: 'Zoé', anonymise_le: null });
    expect(ligne(db, 'SELECT prenom FROM adherents WHERE id = 5')).toEqual({ prenom: 'Alice' });
    expect(ligne(db, 'SELECT prenom FROM adherents WHERE id = 6')).toEqual({ prenom: 'Sam' });
  });

  it('anonymise un responsable sans autre enfant, garde celui qui en a encore un', () => {
    expect(ligne(db, 'SELECT prenom, email, telephone, supprime_le IS NOT NULL AS supprime FROM users WHERE id = 2')).toEqual({
      prenom: 'Ancien',
      email: null,
      telephone: null,
      supprime: 1,
    });
    expect(ligne(db, "SELECT count(*) AS n FROM identites WHERE user_id = 2")).toEqual({ n: 0 });
    expect(ligne(db, 'SELECT prenom, email FROM users WHERE id = 3')).toEqual({ prenom: 'Rita', email: 'rita@famille.test' });
    expect(ligne(db, 'SELECT count(*) AS n FROM liens WHERE user_id = 3')).toEqual({ n: 1 });
  });

  it('adhérent majeur : son propre compte suit sa fiche', () => {
    expect(ligne(db, 'SELECT prenom, email FROM users WHERE id = 4')).toEqual({ prenom: 'Ancien', email: null });
  });

  it('durées techniques : journal de plus d’un an, sessions expirées', () => {
    expect(ligne(db, 'SELECT count(*) AS n FROM journal_acces')).toEqual({ n: 1 });
    expect((db.prepare('SELECT empreinte FROM sessions ORDER BY empreinte').all() as { empreinte: string }[]).map((s) => s.empreinte)).toEqual(['s3']);
  });

  it('rapport du passage', () => {
    expect(ligne(db, 'SELECT seuil, adherents, comptes FROM purges')).toEqual({ seuil: 2023, adherents: 3, comptes: 2 });
  });

  it('un second passage ne touche plus rien', () => {
    purger(db, '2026-10-05 03:00:00');
    expect(ligne(db, 'SELECT adherents, comptes FROM purges ORDER BY id DESC LIMIT 1')).toEqual({ adherents: 0, comptes: 0 });
    expect(ligne(db, 'SELECT prenom FROM adherents WHERE id = 3')).toEqual({ prenom: 'Zoé' });
  });
});
