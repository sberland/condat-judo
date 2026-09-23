-- Seed de DÉVELOPPEMENT LOCAL uniquement (npm run db:seed:local). Jamais en --remote.
-- Données fictives : le dépôt est public, aucune donnée personnelle réelle ici.
-- Idempotent : INSERT OR IGNORE.

INSERT OR IGNORE INTO users (id, prenom, nom, email, role) VALUES
  (1, 'Admin',  'Dev', 'admin.dev@example.test',  'admin'),
  (2, 'Parent', 'Dev', 'parent.dev@example.test', 'membre');

-- Identités du fournisseur `dev` (DEV_SUBJECT dans app/.dev.vars).
INSERT OR IGNORE INTO identites (provider, subject, user_id) VALUES
  ('dev', 'dev-admin',  1),
  ('dev', 'dev-parent', 2);

INSERT OR IGNORE INTO saisons (id, libelle, debut, fin) VALUES
  (1, '2025-2026', '2025-09-01', '2026-08-31'),
  (2, '2026-2027', '2026-09-01', '2027-08-31');
