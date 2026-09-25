-- Dossier d'adhésion rempli en ligne par les familles (spec 010b), pour la saison dont le bureau a
-- ouvert les inscriptions. Traçabilité seulement : qui a envoyé le dossier et quand, engagements
-- acceptés (règlement, assurance, information données personnelles), auteur de l'attestation de
-- santé cochée en ligne. ⚠️ Toujours aucune donnée de santé.

ALTER TABLE adhesions ADD COLUMN formalite_par INTEGER REFERENCES users(id);   -- attestation cochée en ligne
ALTER TABLE adhesions ADD COLUMN engagements_le TEXT;                         -- règlement, assurance, information RGPD
ALTER TABLE adhesions ADD COLUMN engagements_par INTEGER REFERENCES users(id);
ALTER TABLE adhesions ADD COLUMN envoye_le TEXT;                              -- dossier envoyé par la famille
ALTER TABLE adhesions ADD COLUMN envoye_par INTEGER REFERENCES users(id);

-- Enfant ajouté par une famille : fiche « à vérifier » par le bureau (effacé à la validation du dossier).
ALTER TABLE adherents ADD COLUMN propose_par INTEGER REFERENCES users(id);
