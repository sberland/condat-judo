-- Compétitions et inscriptions des adhérents (spec 009).
-- Une compétition est une information publique (date, lieu, infos pratiques) ; les inscriptions
-- ne sont visibles que du bureau et des responsables de l'enfant.

CREATE TABLE competitions (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  nom           TEXT    NOT NULL,
  date          TEXT    NOT NULL,                      -- AAAA-MM-JJ
  lieu          TEXT    NOT NULL,                      -- ville / salle
  adresse       TEXT,                                  -- pour l'itinéraire
  lien_officiel TEXT,                                  -- page de l'organisateur / de la fédération
  infos         TEXT,                                  -- pesée, horaires, pièces à apporter (texte du bureau)
  categories    TEXT    NOT NULL,                      -- JSON : ids de content/categories.ts
  sexe          TEXT    CHECK (sexe IN ('F', 'M')),    -- NULL = mixte
  date_limite   TEXT    NOT NULL,                      -- AAAA-MM-JJ, inscription possible ce jour inclus
  statut        TEXT    NOT NULL DEFAULT 'ouverte' CHECK (statut IN ('ouverte', 'cloturee', 'annulee')),
  cree_par      INTEGER REFERENCES users(id),
  created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_competitions_date ON competitions (date);

CREATE TABLE inscriptions_competition (
  competition_id INTEGER NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
  adherent_id    INTEGER NOT NULL REFERENCES adherents(id),
  inscrit_par    INTEGER REFERENCES users(id),         -- responsable, ou membre du bureau
  inscrit_le     TEXT    NOT NULL DEFAULT (datetime('now')),
  ressaisi_le    TEXT,                                 -- ressaisi sur le site fédéral
  PRIMARY KEY (competition_id, adherent_id)
);

CREATE INDEX idx_inscriptions_competition_adherent ON inscriptions_competition (adherent_id);
