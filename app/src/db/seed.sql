-- Seed de DÉVELOPPEMENT LOCAL uniquement (npm run db:seed:local). Jamais en --remote.
-- Données fictives : le dépôt est public, aucune donnée personnelle réelle ici.
-- Idempotent : INSERT OR IGNORE.

-- Comptes (DEV_SUBJECT dans app/.dev.vars pour se connecter en tant que l'un d'eux).
INSERT OR IGNORE INTO users (id, prenom, nom, email, telephone) VALUES
  (1, 'Admin',  'Dev',     'admin.dev@example.test',   '06 00 00 00 01'),
  (2, 'Parent', 'Dev',     'parent.dev@example.test',  '06 00 00 00 02'),
  (3, 'Claire', 'Exemple', 'claire.exemple@example.test', '06 00 00 00 03'),
  (4, 'Marc',   'Exemple', 'marc.exemple@example.test',   '06 00 00 00 04'),
  (5, 'Bureau', 'Dev',     'bureau.dev@example.test',  '06 00 00 00 05');

INSERT OR IGNORE INTO identites (provider, subject, user_id) VALUES
  ('dev', 'dev-admin',  1),
  ('dev', 'dev-parent', 2),
  ('dev', 'dev-bureau', 5);

INSERT OR IGNORE INTO user_roles (user_id, role) VALUES
  (1, 'admin'),
  (5, 'bureau'),
  (5, 'contenu');

-- Adhérents fictifs.
INSERT OR IGNORE INTO adherents (id, prenom, nom, date_naissance, sexe, grade, code_postal, ville) VALUES
  (1, 'Léa',  'Dev',     '2017-03-12', 'F', 'Jaune',   '87920', 'Condat-sur-Vienne'),
  (2, 'Hugo', 'Dev',     '2020-11-02', 'M', 'Blanche', '87920', 'Condat-sur-Vienne'),
  (3, 'Nina', 'Exemple', '2014-06-21', 'F', 'Orange',  '87170', 'Isle');

-- Parent Dev : deux enfants ; Nina : parents séparés, un seul autorisé à l'inscrire.
INSERT OR IGNORE INTO liens (user_id, adherent_id, qualite, peut_inscrire, peut_recuperer, est_contact) VALUES
  (2, 1, 'pere', 1, 1, 1),
  (2, 2, 'pere', 1, 1, 1),
  (3, 3, 'mere', 1, 1, 1),
  (4, 3, 'pere', 0, 1, 1);

INSERT OR IGNORE INTO personnes_autorisees (id, adherent_id, prenom, nom, lien, telephone) VALUES
  (1, 1, 'Jeanne', 'Dev', 'grand-mère', '06 00 00 00 09');

INSERT OR IGNORE INTO saisons (id, libelle, debut, fin) VALUES
  (1, '2025-2026', '2025-09-01', '2026-08-31'),
  (2, '2026-2027', '2026-09-01', '2027-08-31');

-- Dossiers d'adhésion 2026/2027 (spec 010a) : Léa complet (3 fois), Nina à compléter (hors
-- commune), Hugo sans dossier (réduction famille proposée : sa sœur Léa a déjà un dossier).
INSERT OR IGNORE INTO adhesions (adherent_id, saison, formule, passeport, hors_commune, reduction_famille,
  montant_participation, montant_licence, montant_supplements, montant_reduction, montant_total,
  paiement_mode, paiement_3_fois, echeance_1, echeance_2, echeance_3, formalite_type, formalite_recue_le,
  soins_urgence, soins_urgence_le, soins_urgence_par, droit_image, droit_image_le, droit_image_par,
  whatsapp, whatsapp_le, whatsapp_par, cree_par) VALUES
  (1, '2026-2027', 'judo-poussins-juniors', 0, 0, 0, 10100, 4600, 0, 0, 14700, 'cheque', 1, 8000, 3400, 3300,
   'attestation_qs_mineur', '2026-09-10', 'oui', '2026-09-10 18:00:00', 1, 'non', '2026-09-10 18:00:00', 1,
   'oui', '2026-09-10 18:00:00', 1, 1),
  (3, '2026-2027', 'judo-poussins-juniors', 0, 1, 0, 10100, 4600, 200, 0, 14900, NULL, 0, 8200, 3400, 3300,
   NULL, NULL, 'non_recueilli', NULL, NULL, 'non_recueilli', NULL, NULL, 'non_recueilli', NULL, NULL, 1);

-- Compétitions fictives (spec 009), datées par rapport au jour du seed : une ouverte (Léa inscrite
-- par son père), une réservée aux filles minimes (Nina : seule sa mère peut l'inscrire), une dont
-- la date limite est passée.
INSERT OR IGNORE INTO competitions (id, nom, date, lieu, adresse, lien_officiel, infos, categories, sexe, date_limite, statut, cree_par) VALUES
  (1, 'Tournoi de l''Exemple', date('now', '+20 days'), 'Limoges — dojo fictif', '1 rue de l''Exemple, 87000 Limoges',
   'https://example.org/tournoi', 'Pesée de 8 h 30 à 9 h.' || char(10) || 'Apporter le passeport sportif et une gourde.',
   '["mini-poussins","poussins","benjamins"]', NULL, date('now', '+10 days'), 'ouverte', 5),
  (2, 'Critérium filles', date('now', '+35 days'), 'Saint-Junien — gymnase fictif', NULL,
   NULL, NULL, '["minimes","cadets"]', 'F', date('now', '+25 days'), 'ouverte', 5),
  (3, 'Interclubs d''automne', date('now', '+5 days'), 'Isle — salle fictive', NULL,
   NULL, 'Inscriptions closes : liste transmise.', '["poussins","benjamins","minimes"]', NULL, date('now', '-1 days'), 'ouverte', 5);

INSERT OR IGNORE INTO inscriptions_competition (competition_id, adherent_id, inscrit_par) VALUES
  (1, 1, 2),
  (3, 1, 5);
