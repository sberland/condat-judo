-- Dossier d'adhésion par adhérent et par saison (spec 010a).
-- Montants FIGÉS à l'enregistrement (centimes), calculés par le Worker depuis la grille de la
-- saison (app/web/src/content/tarifs.ts ; référentiels en base avec la spec 003).
-- ⚠️ Aucune donnée de santé : formalités = type de pièce + date de réception, rien d'autre ; pas
-- de champ de texte libre. Consentements et autorisations datés, avec qui les a saisis.

CREATE TABLE adhesions (
  id                    INTEGER PRIMARY KEY AUTOINCREMENT,
  adherent_id           INTEGER NOT NULL REFERENCES adherents(id),
  saison                TEXT    NOT NULL,                  -- ex. '2026-2027'
  formule               TEXT    NOT NULL,                  -- id de formule de la grille
  passeport             INTEGER NOT NULL DEFAULT 0 CHECK (passeport IN (0, 1)),
  hors_commune          INTEGER NOT NULL DEFAULT 0 CHECK (hors_commune IN (0, 1)),
  reduction_famille     INTEGER NOT NULL DEFAULT 0 CHECK (reduction_famille IN (0, 1)),
  montant_participation INTEGER NOT NULL,
  montant_licence       INTEGER NOT NULL,
  montant_supplements   INTEGER NOT NULL,
  montant_reduction     INTEGER NOT NULL,
  montant_total         INTEGER NOT NULL,
  paiement_mode         TEXT    CHECK (paiement_mode IN ('cheque', 'especes', 'cb', 'autre')),
  paiement_3_fois       INTEGER NOT NULL DEFAULT 0 CHECK (paiement_3_fois IN (0, 1)),
  echeance_1            INTEGER NOT NULL,
  echeance_2            INTEGER NOT NULL,
  echeance_3            INTEGER NOT NULL,
  formalite_type        TEXT    CHECK (formalite_type IN ('attestation_qs_mineur', 'certificat', 'attestation_qs_sport')),
  formalite_recue_le    TEXT,                              -- AAAA-MM-JJ
  soins_urgence         TEXT    NOT NULL DEFAULT 'non_recueilli' CHECK (soins_urgence IN ('oui', 'non', 'non_recueilli')),
  soins_urgence_le      TEXT,
  soins_urgence_par     INTEGER REFERENCES users(id),
  droit_image           TEXT    NOT NULL DEFAULT 'non_recueilli' CHECK (droit_image IN ('oui', 'non', 'non_recueilli')),
  droit_image_le        TEXT,
  droit_image_par       INTEGER REFERENCES users(id),
  whatsapp              TEXT    NOT NULL DEFAULT 'non_recueilli' CHECK (whatsapp IN ('oui', 'non', 'non_recueilli')),
  whatsapp_le           TEXT,
  whatsapp_par          INTEGER REFERENCES users(id),
  valide_le             TEXT,
  valide_par            INTEGER REFERENCES users(id),
  cree_par              INTEGER REFERENCES users(id),
  created_at            TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at            TEXT    NOT NULL DEFAULT (datetime('now')),
  UNIQUE (adherent_id, saison)
);

CREATE INDEX idx_adhesions_saison ON adhesions (saison);
