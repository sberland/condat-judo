-- Le club ne propose plus le jujitsu (réponse au questionnaire, spec 027, 2026-09-30) : la
-- discipline est retirée du contenu « Disciplines » (ordre des autres conservé), avec une nouvelle
-- version dans l'historique. Même contenu que content/contenu-initial.ts (test contenu.test.ts).

UPDATE contenus SET
  valeur = json_set(valeur, '$.disciplines', (
    SELECT json_group_array(json(value)) FROM (
      SELECT value FROM json_each(contenus.valeur, '$.disciplines')
      WHERE json_extract(value, '$.id') != 'jujitsu'
      ORDER BY key
    )
  )),
  modifie_le = datetime('now'), modifie_par = NULL
WHERE cle = 'disciplines';

INSERT INTO contenus_versions (cle, valeur, statut) SELECT cle, valeur, statut FROM contenus WHERE cle = 'disciplines';
