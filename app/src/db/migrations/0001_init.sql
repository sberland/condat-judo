-- Socle : utilisateurs + seam d'identité + table exemple (saisons).
-- Règle : aucun droit n'est rattaché à l'email ni à un artefact du fournisseur d'auth.
-- Les droits référencent users.id ; seule `identites` connaît le fournisseur.
-- Cf. workspace/docs/technical-docs/identite-auth.md

-- Personne connue du club, identité interne stable. Créée par un admin (invitation).
CREATE TABLE users (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  prenom      TEXT    NOT NULL,
  nom         TEXT    NOT NULL,
  -- Contact + liaison de la première connexion. Jamais porteur de droit. Stocké en minuscules.
  email       TEXT    UNIQUE CHECK (email IS NULL OR email = lower(email)),
  -- Rôle-socle provisoire ; le modèle de droits club (parent, encadrant, bureau…) viendra par spec.
  role        TEXT    NOT NULL DEFAULT 'membre' CHECK (role IN ('admin', 'membre')),
  created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  last_login  TEXT,
  -- Suppression logique : la ligne reste (traçabilité), plus aucun accès.
  supprime_le TEXT
);

-- Identité externe (fournisseur + identifiant opaque) → utilisateur interne.
-- provider : 'cf-access' (Cloudflare Access, claim sub), 'dev' (local) ; demain l'auth applicative.
CREATE TABLE identites (
  provider   TEXT    NOT NULL,
  subject    TEXT    NOT NULL,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email_vu   TEXT,   -- dernier email vu chez le fournisseur (information, jamais un critère)
  created_at TEXT    NOT NULL DEFAULT (datetime('now')),
  last_seen  TEXT,
  PRIMARY KEY (provider, subject)
);

CREATE INDEX idx_identites_user ON identites (user_id);

-- Table exemple : saisons sportives (licences, compétitions et inscriptions y seront rattachées).
CREATE TABLE saisons (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  libelle TEXT    NOT NULL UNIQUE,   -- ex. '2026-2027'
  debut   TEXT    NOT NULL,          -- ISO YYYY-MM-DD
  fin     TEXT    NOT NULL,
  CHECK (debut < fin)
);
