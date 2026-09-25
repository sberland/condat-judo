-- Actualités du club (spec 013) : publiées par le bureau ou la personne qui gère le site,
-- publiques ou réservées aux familles (tout compte connecté). Le calendrier du club, ce sont les
-- événements (spec 021) : abonnement agenda /api/calendrier.ics.

CREATE TABLE actualites (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  titre       TEXT    NOT NULL,
  texte       TEXT    NOT NULL,                                -- paragraphes séparés par une ligne vide
  visibilite  TEXT    NOT NULL DEFAULT 'public' CHECK (visibilite IN ('public', 'familles')),
  statut      TEXT    NOT NULL DEFAULT 'brouillon' CHECK (statut IN ('brouillon', 'publiee')),
  publiee_le  TEXT,                                            -- première publication (UTC)
  auteur      INTEGER REFERENCES users(id),
  created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))      -- aussi changé avec la photo (cache)
);

CREATE INDEX idx_actualites_publiee ON actualites (statut, publiee_le);

-- Photo d'une actualité (une au plus), réduite dans le navigateur. `accord` : l'auteur a confirmé
-- que les enfants reconnaissables ont donné leur accord droit à l'image.
CREATE TABLE actualites_images (
  actualite_id INTEGER PRIMARY KEY REFERENCES actualites(id) ON DELETE CASCADE,
  type         TEXT    NOT NULL CHECK (type IN ('image/jpeg', 'image/webp')),
  accord       INTEGER NOT NULL CHECK (accord = 1),
  deposee_par  INTEGER REFERENCES users(id),
  deposee_le   TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- L'image en base64, découpée en morceaux de 60 000 caractères au plus : chaque ligne tient dans
-- une instruction de l'export D1 (sauvegarde, recopie vers la qualif : 100 Ko par instruction).
CREATE TABLE actualites_images_morceaux (
  actualite_id INTEGER NOT NULL REFERENCES actualites_images(actualite_id) ON DELETE CASCADE,
  rang         INTEGER NOT NULL,
  donnees      TEXT    NOT NULL,
  PRIMARY KEY (actualite_id, rang)
);
