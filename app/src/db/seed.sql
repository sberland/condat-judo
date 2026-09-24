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
