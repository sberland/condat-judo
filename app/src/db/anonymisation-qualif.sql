-- Anonymisation de la copie de QUALIFICATION (spec 008) — appliquée après chaque recopie de la
-- prod dans la D1 de preview (.github/workflows/preview.yml, deploy/refresh-preview-db.ps1),
-- après les migrations. ⚠️ JAMAIS sur la prod.
--
-- Principe : les testeurs n'ont besoin que de données réalistes, pas réelles (minimisation RGPD).
-- - Comptes AVEC un rôle (bureau, admin…) conservés : ce sont les testeurs, qui se connectent à la
--   qualif avec leur vrai e-mail (deploy/lien-connexion.ps1 -Cible preview) ; leurs noms sont
--   déjà publics (page « Le club »).
-- - Familles, adhérents et personnes autorisées pseudonymisés, de façon stable (fonction de l'id) :
--   liens parent ↔ enfant intacts, année de naissance conservée (catégories inchangées), code
--   postal et ville conservés (supplément « hors commune »).
-- - Sessions et liens de connexion copiés de la prod supprimés : aucun accès de la prod ne vaut ici.
--
-- ⚠️ Toute colonne ajoutée par une migration doit être classée dans src/db/donnees-personnelles.ts
-- (et traitée ici si elle est personnelle) : sinon le test anonymisation.test.ts échoue (CI).

DELETE FROM sessions;
DELETE FROM liens_connexion;
-- Passkeys (spec 005c) : liées à l'adresse de la prod, sans objet ici ; défis en cours.
DELETE FROM passkeys;
DELETE FROM defis_passkey;
DELETE FROM journal_acces;
DELETE FROM photos_adherents;  -- visages d'enfants (spec 012b) : les testeurs déposent des photos fictives

-- Comptes sans rôle (familles, adhérents majeurs).
UPDATE users SET
  prenom = CASE id % 12
    WHEN 0 THEN 'Camille' WHEN 1 THEN 'Julien' WHEN 2 THEN 'Sophie' WHEN 3 THEN 'Nicolas'
    WHEN 4 THEN 'Aurélie' WHEN 5 THEN 'Thomas' WHEN 6 THEN 'Émilie' WHEN 7 THEN 'Mathieu'
    WHEN 8 THEN 'Céline' WHEN 9 THEN 'Romain' WHEN 10 THEN 'Laure' ELSE 'Olivier' END,
  nom = CASE (id * 5) % 12
    WHEN 0 THEN 'Martin' WHEN 1 THEN 'Bernard' WHEN 2 THEN 'Dubois' WHEN 3 THEN 'Thomas'
    WHEN 4 THEN 'Robert' WHEN 5 THEN 'Richard' WHEN 6 THEN 'Petit' WHEN 7 THEN 'Durand'
    WHEN 8 THEN 'Leroy' WHEN 9 THEN 'Moreau' WHEN 10 THEN 'Simon' ELSE 'Laurent' END,
  email = CASE WHEN email IS NULL THEN NULL ELSE 'compte' || id || '@exemple.test' END,
  telephone = CASE WHEN telephone IS NULL THEN NULL
    ELSE printf('06 00 %02d %02d %02d', (id / 10000) % 100, (id / 100) % 100, id % 100) END
WHERE NOT EXISTS (SELECT 1 FROM user_roles r WHERE r.user_id = users.id);

UPDATE identites SET email_vu = NULL
WHERE NOT EXISTS (SELECT 1 FROM user_roles r WHERE r.user_id = identites.user_id);

-- Adhérents (sauf un adhérent majeur qui a lui-même un rôle au club).
UPDATE adherents SET
  prenom = CASE id % 12
    WHEN 0 THEN 'Léo' WHEN 1 THEN 'Jade' WHEN 2 THEN 'Gabriel' WHEN 3 THEN 'Louise'
    WHEN 4 THEN 'Raphaël' WHEN 5 THEN 'Emma' WHEN 6 THEN 'Arthur' WHEN 7 THEN 'Alice'
    WHEN 8 THEN 'Jules' WHEN 9 THEN 'Chloé' WHEN 10 THEN 'Adam' ELSE 'Lina' END,
  nom = CASE (id * 7) % 12
    WHEN 0 THEN 'Martin' WHEN 1 THEN 'Bernard' WHEN 2 THEN 'Dubois' WHEN 3 THEN 'Thomas'
    WHEN 4 THEN 'Robert' WHEN 5 THEN 'Richard' WHEN 6 THEN 'Petit' WHEN 7 THEN 'Durand'
    WHEN 8 THEN 'Leroy' WHEN 9 THEN 'Moreau' WHEN 10 THEN 'Simon' ELSE 'Laurent' END,
  date_naissance = substr(date_naissance, 1, 4) || '-06-15',
  numero_licence = CASE WHEN numero_licence IS NULL THEN NULL ELSE printf('T%07d', id) END,
  adresse = CASE WHEN adresse IS NULL THEN NULL ELSE printf('%d rue de l''Exemple', id) END
WHERE user_id IS NULL OR NOT EXISTS (SELECT 1 FROM user_roles r WHERE r.user_id = adherents.user_id);

-- Personnes autorisées à récupérer un enfant (sans compte).
UPDATE personnes_autorisees SET
  prenom = CASE id % 6
    WHEN 0 THEN 'Monique' WHEN 1 THEN 'Bernard' WHEN 2 THEN 'Sylvie'
    WHEN 3 THEN 'Gérard' WHEN 4 THEN 'Nathalie' ELSE 'Patrick' END,
  nom = CASE (id * 5) % 6
    WHEN 0 THEN 'Garcia' WHEN 1 THEN 'David' WHEN 2 THEN 'Bertrand'
    WHEN 3 THEN 'Roux' WHEN 4 THEN 'Vincent' ELSE 'Fournier' END,
  telephone = CASE WHEN telephone IS NULL THEN NULL ELSE printf('07 00 00 %02d %02d', (id / 100) % 100, id % 100) END;

-- Garderie (spec 012c) : nom de la personne avec qui l'enfant est parti.
UPDATE garderie_demandes SET parti_avec = CASE WHEN parti_avec IS NULL THEN NULL ELSE 'Personne autorisée (fictive)' END;

-- Paiements (spec 011) : la référence (n° de chèque, banque, titulaire) devient fictive.
UPDATE paiements SET reference = CASE WHEN reference IS NULL THEN NULL ELSE printf('Réf. fictive %06d', id) END;
