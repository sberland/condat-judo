-- Événements du club (spec 021) : la table `competitions` (spec 009) accueille désormais tous les
-- événements — compétitions, stages, rencontres, repas, fêtes… Nom historique conservé.
-- Inscription au choix du bureau : aucune (information), enfants (comme les compétitions),
-- famille (nombre d'adultes et d'enfants, ex. repas).

ALTER TABLE competitions ADD COLUMN type TEXT NOT NULL DEFAULT 'competition'
  CHECK (type IN ('competition', 'stage', 'rencontre', 'repas', 'fete', 'autre'));
ALTER TABLE competitions ADD COLUMN inscription TEXT NOT NULL DEFAULT 'enfants'
  CHECK (inscription IN ('aucune', 'enfants', 'famille'));
ALTER TABLE competitions ADD COLUMN heure TEXT;                 -- HH:MM, facultative

-- Inscription d'une famille (mode « famille ») : un responsable, un nombre de participants.
CREATE TABLE inscriptions_famille (
  competition_id INTEGER NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
  user_id        INTEGER NOT NULL REFERENCES users(id),
  adultes        INTEGER NOT NULL DEFAULT 0 CHECK (adultes BETWEEN 0 AND 20),
  enfants        INTEGER NOT NULL DEFAULT 0 CHECK (enfants BETWEEN 0 AND 20),
  inscrit_le     TEXT    NOT NULL DEFAULT (datetime('now')),
  modifie_le     TEXT,
  PRIMARY KEY (competition_id, user_id)
);
