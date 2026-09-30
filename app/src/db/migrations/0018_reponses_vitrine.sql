-- Réponses du club au questionnaire (spec 026, 2026-09-30) : horaires 2026/2027 (capture du club),
-- nom du dojo, compte Instagram. Données seulement ; même contenu que content/referentiel-initial.ts
-- et content/contenu-initial.ts (tests referentiel.test.ts et contenu.test.ts).

UPDATE saisons SET referentiel = json_set(referentiel, '$.horaires', json('{"provisoire":false,"cours":[{"jour":"lundi","debut":"18:00","fin":"19:00","cours":"Yoga","public":"Adultes"},{"jour":"mercredi","debut":"15:00","fin":"16:00","cours":"Judo mini-poussins","public":"Nés en 2019 et 2020"},{"jour":"mercredi","debut":"16:00","fin":"17:00","cours":"Judo micro-poussins","public":"Nés en 2021 et 2022"},{"jour":"mercredi","debut":"17:00","fin":"18:00","cours":"Judo poussins à juniors","public":"Nés de 2007 à 2018"},{"jour":"mercredi","debut":"18:00","fin":"19:00","cours":"Taïso","public":"Tout public"},{"jour":"jeudi","debut":"18:15","fin":"19:15","cours":"Yoga","public":"Adultes"},{"jour":"vendredi","debut":"18:30","fin":"19:30","cours":"Judo poussins à juniors","public":"Nés de 2007 à 2018"},{"jour":"vendredi","debut":"19:30","fin":"20:30","cours":"Taïso","public":"Tout public"},{"jour":"vendredi","debut":"20:30","fin":"21:30","cours":"Judo adulte","public":"Adultes"}]}'))
WHERE id = '2026-2027';

UPDATE contenus SET
  valeur = json_set(valeur, '$.nomDojo', 'Dojo Alice Milliat', '$.instagram', 'https://www.instagram.com/judo_condat/'),
  modifie_le = datetime('now'), modifie_par = NULL
WHERE cle = 'club';

-- Nouvelle version dans l'historique du contenu (retour possible à la précédente).
INSERT INTO contenus_versions (cle, valeur, statut) SELECT cle, valeur, statut FROM contenus WHERE cle = 'club';
