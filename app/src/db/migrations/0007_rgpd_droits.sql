-- RGPD : exercice des droits outillé et purge automatique (spec 019).

-- Anonymisation à l'échéance de la durée de conservation (tâche planifiée hebdomadaire, prod).
ALTER TABLE adherents ADD COLUMN anonymise_le TEXT;
ALTER TABLE users ADD COLUMN anonymise_le TEXT;

-- Journal des accès sensibles : qui a consulté ou modifié les coordonnées d'une famille.
-- Conservé un an (purgé par la tâche planifiée) ; consultable par l'administrateur.
CREATE TABLE journal_acces (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  cree_le  TEXT    NOT NULL DEFAULT (datetime('now')),
  user_id  INTEGER REFERENCES users(id),        -- qui
  action   TEXT    NOT NULL CHECK (action IN ('consultation', 'modification', 'suppression', 'export', 'lien_connexion', 'deconnexion')),
  cible    TEXT    NOT NULL CHECK (cible IN ('adherent', 'compte', 'comptes', 'famille')),
  cible_id INTEGER,                              -- adherents.id, users.id ou adhesions.id (famille) ; NULL = liste
  detail   TEXT                                  -- ex. « responsable », « dossier », « rôles »
);

CREATE INDEX idx_journal_acces_cible ON journal_acces (cible, cible_id);
CREATE INDEX idx_journal_acces_date ON journal_acces (cree_le);

-- Rapport de chaque passage de la purge (nombres seulement).
CREATE TABLE purges (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  execute_le  TEXT    NOT NULL,
  seuil       INTEGER NOT NULL,                  -- anonymisés : dernière saison commencée avant cette année
  adherents   INTEGER NOT NULL,
  comptes     INTEGER NOT NULL
);
