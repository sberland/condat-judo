-- Suivi des cotisations par le trésorier (spec 011).
-- Un paiement = ce que la famille remet (un chèque, des espèces…) ; il est RÉPARTI sur un ou
-- plusieurs dossiers d'adhésion (un chèque pour deux enfants). Restant dû d'un dossier =
-- montant_total du dossier − somme de ses parts. Montants en centimes.

CREATE TABLE paiements (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  saison       TEXT    NOT NULL,                        -- ex. '2026-2027'
  montant      INTEGER NOT NULL CHECK (montant > 0),
  mode         TEXT    NOT NULL CHECK (mode IN ('cheque', 'especes', 'cb', 'virement', 'cheques_vacances', 'pass_sport', 'autre')),
  reference    TEXT,                                    -- n° de chèque, banque (jamais montré aux familles)
  recu_le      TEXT    NOT NULL,                        -- AAAA-MM-JJ, remis au club
  encaisser_le TEXT,                                    -- AAAA-MM-JJ, chèque à encaisser plus tard (paiement en 3 fois)
  encaisse_le  TEXT,                                    -- AAAA-MM-JJ, remis en banque
  saisi_par    INTEGER REFERENCES users(id),
  created_at   TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_paiements_saison ON paiements (saison);

CREATE TABLE paiement_parts (
  paiement_id INTEGER NOT NULL REFERENCES paiements(id) ON DELETE CASCADE,
  adhesion_id INTEGER NOT NULL REFERENCES adhesions(id),
  montant     INTEGER NOT NULL CHECK (montant > 0),
  PRIMARY KEY (paiement_id, adhesion_id)
);

CREATE INDEX idx_paiement_parts_adhesion ON paiement_parts (adhesion_id);
