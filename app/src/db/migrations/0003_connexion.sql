-- Connexion applicative (spec 005a) : liens de connexion personnels et sessions.
-- Les jetons ne sont JAMAIS stockés en clair : seule leur empreinte SHA-256 (hex) est en base.
-- Dates en UTC au format datetime('now') ('AAAA-MM-JJ HH:MM:SS'), comparées comme du texte.
-- Cf. workspace/docs/technical-docs/identite-auth.md

-- Lien personnel remis par le bureau (WhatsApp) : usage unique, durée courte.
CREATE TABLE liens_connexion (
  empreinte  TEXT    PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id),
  -- Qui a créé le lien (traçabilité) ; NULL = script deploy/lien-connexion.ps1.
  cree_par   INTEGER REFERENCES users(id),
  created_at TEXT    NOT NULL DEFAULT (datetime('now')),
  expire_le  TEXT    NOT NULL,
  utilise_le TEXT,
  -- Remplacé par un lien plus récent, compte supprimé…
  annule_le  TEXT
);

CREATE INDEX idx_liens_connexion_user ON liens_connexion (user_id);

-- Session navigateur (cookie __Host-session) : 6 mois glissants.
CREATE TABLE sessions (
  empreinte    TEXT    PRIMARY KEY,
  user_id      INTEGER NOT NULL REFERENCES users(id),
  created_at   TEXT    NOT NULL DEFAULT (datetime('now')),
  expire_le    TEXT    NOT NULL,
  -- Dernière prolongation (au plus une par jour).
  renouvele_le TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_sessions_user ON sessions (user_id);
