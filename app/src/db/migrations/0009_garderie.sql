-- Garderie du mercredi, demandes des parents (spec 012a).
-- Une demande = « récupérer cet enfant ce mercredi, à ce lieu » ; l'annulation supprime la
-- demande. Réglages (lieux, période, mercredis fermés, délai) : référentiel de la saison.

CREATE TABLE garderie_demandes (
  adherent_id INTEGER NOT NULL REFERENCES adherents(id),
  date        TEXT    NOT NULL,                    -- le mercredi, AAAA-MM-JJ
  lieu        TEXT    NOT NULL,                    -- lieu de récupération (au moment de la demande)
  demande_par INTEGER REFERENCES users(id),        -- responsable, ou membre du bureau
  demande_le  TEXT    NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (adherent_id, date)
);

CREATE INDEX idx_garderie_demandes_date ON garderie_demandes (date);

-- Réglages par défaut dans chaque saison existante (à confirmer par le bureau) : de début
-- septembre à fin juin, la veille à 20 h.
UPDATE saisons SET referentiel = json_set(referentiel, '$.garderie', json_object(
    'lieux', json_array('Garderie de l’école'),
    'debut', date(substr(id, 1, 4) || '-09-01', 'weekday 3'),
    'fin', date(substr(id, 6, 4) || '-06-24', 'weekday 3'),
    'fermes', json_array(),
    'limite', json_object('jours', 1, 'heure', '20:00'),
    'provisoire', json('true')))
WHERE json_extract(referentiel, '$.garderie') IS NULL;
