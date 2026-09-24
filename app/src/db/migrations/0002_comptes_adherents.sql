-- Spec 004 : comptes, rôles cumulables, adhérents, responsables légaux, personnes autorisées.
-- Tous les droits référencent users.id (jamais l'email). Cf. workspace/tasks/…/004-comptes-foyers-roles.md

-- Coordonnées d'un compte (responsable légal, adhérent majeur, membre du bureau).
ALTER TABLE users ADD COLUMN telephone TEXT;

-- Rôles club, cumulables. Un compte sans rôle = « famille » (droits dérivés de ses liens).
CREATE TABLE user_roles (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role    TEXT    NOT NULL CHECK (role IN ('admin', 'bureau', 'tresorier', 'encadrant', 'contenu')),
  PRIMARY KEY (user_id, role)
);

-- Reprise du rôle-socle provisoire de 0001, puis suppression de la colonne.
INSERT INTO user_roles (user_id, role) SELECT id, 'admin' FROM users WHERE role = 'admin';
ALTER TABLE users DROP COLUMN role;

-- Pratiquant (enfant ou adulte). Données minimales utiles au club et à la licence fédérale.
CREATE TABLE adherents (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  prenom         TEXT    NOT NULL,
  nom            TEXT    NOT NULL,
  date_naissance TEXT    NOT NULL,                       -- ISO YYYY-MM-DD (catégorie calculée, 003)
  sexe           TEXT    NOT NULL CHECK (sexe IN ('F', 'M')),
  grade          TEXT,                                   -- ceinture (référentiel en 003)
  numero_licence TEXT,                                   -- n° de licence France Judo
  adresse        TEXT,
  code_postal    TEXT,
  ville          TEXT,
  -- Adhérent majeur qui a son propre compte (au plus un adhérent par compte).
  user_id        INTEGER UNIQUE REFERENCES users(id),
  created_at     TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at     TEXT    NOT NULL DEFAULT (datetime('now')),
  supprime_le    TEXT                                    -- suppression logique
);

-- Responsable ↔ adhérent : plusieurs responsables par enfant, plusieurs enfants par responsable.
CREATE TABLE liens (
  user_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  adherent_id    INTEGER NOT NULL REFERENCES adherents(id) ON DELETE CASCADE,
  qualite        TEXT    NOT NULL CHECK (qualite IN ('mere', 'pere', 'tuteur', 'autre')),
  peut_inscrire  INTEGER NOT NULL DEFAULT 1 CHECK (peut_inscrire IN (0, 1)),   -- compétitions, garderie
  peut_recuperer INTEGER NOT NULL DEFAULT 1 CHECK (peut_recuperer IN (0, 1)),  -- garderie, fin de cours
  est_contact    INTEGER NOT NULL DEFAULT 1 CHECK (est_contact IN (0, 1)),     -- prévenu par le club
  created_at     TEXT    NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, adherent_id)
);

CREATE INDEX idx_liens_adherent ON liens (adherent_id);

-- Personnes sans compte autorisées à récupérer un enfant (grands-parents, nounou…).
CREATE TABLE personnes_autorisees (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  adherent_id INTEGER NOT NULL REFERENCES adherents(id) ON DELETE CASCADE,
  prenom      TEXT    NOT NULL,
  nom         TEXT    NOT NULL,
  lien        TEXT    NOT NULL,                          -- ex. « grand-mère »
  telephone   TEXT,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_personnes_autorisees_adherent ON personnes_autorisees (adherent_id);
