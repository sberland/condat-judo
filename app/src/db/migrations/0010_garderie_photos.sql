-- Garderie du mercredi : liste du jour de l'encadrant et photos d'identification (spec 012b).

-- Accord « photo pour la garderie » : la photo de l'enfant est montrée aux encadrants, le mercredi
-- même, pour le reconnaître. Recueilli comme les autres accords du dossier (bureau ou famille).
ALTER TABLE adhesions ADD COLUMN photo_garderie TEXT NOT NULL DEFAULT 'non_recueilli'
  CHECK (photo_garderie IN ('oui', 'non', 'non_recueilli'));
ALTER TABLE adhesions ADD COLUMN photo_garderie_le TEXT;
ALTER TABLE adhesions ADD COLUMN photo_garderie_par INTEGER REFERENCES users(id);

-- Une photo par adhérent, réduite dans le navigateur (JPEG ou WebP, 60 Ko au plus), en base64 :
-- une ligne tient dans une instruction de l'export D1 (sauvegarde, recopie vers la qualif).
-- Effacée au bout d'un an, à l'anonymisation de l'adhérent ou au retrait de l'accord.
CREATE TABLE photos_adherents (
  adherent_id INTEGER PRIMARY KEY REFERENCES adherents(id),
  image       TEXT    NOT NULL,                                        -- base64
  type        TEXT    NOT NULL CHECK (type IN ('image/jpeg', 'image/webp')),
  deposee_le  TEXT    NOT NULL DEFAULT (datetime('now')),
  deposee_par INTEGER REFERENCES users(id)                             -- responsable ou bureau
);
