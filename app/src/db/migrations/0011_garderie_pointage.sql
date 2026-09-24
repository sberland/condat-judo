-- Garderie du mercredi : pointage par l'encadrant (spec 012c), sur la demande du mercredi.
-- Récupéré à la garderie, ou absent ; puis parti avec une personne autorisée (nom recopié au
-- moment du départ : la liste des personnes autorisées peut changer ensuite). Effacé avec la
-- demande (un an après le mercredi, ou à l'anonymisation de l'enfant).

ALTER TABLE garderie_demandes ADD COLUMN recupere_le TEXT;                        -- UTC
ALTER TABLE garderie_demandes ADD COLUMN absent_le TEXT;                          -- pas à la garderie
ALTER TABLE garderie_demandes ADD COLUMN pointe_par INTEGER REFERENCES users(id); -- récupéré / absent
ALTER TABLE garderie_demandes ADD COLUMN parti_le TEXT;
ALTER TABLE garderie_demandes ADD COLUMN parti_avec TEXT;                         -- « Prénom Nom (grand-mère) »
ALTER TABLE garderie_demandes ADD COLUMN parti_par INTEGER REFERENCES users(id);
