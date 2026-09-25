-- Grille tarifaire : le groupe « Taïso et yoga » devient deux groupes, « Taïso » et « Yoga »
-- (spec 022) — mêmes formules, mêmes montants, ordre conservé. Saisons où le groupe existe encore
-- sous ce titre seulement (un groupe renommé par le bureau n'est pas touché).

UPDATE saisons SET
  referentiel = json_set(referentiel, '$.tarifs.groupes', (
    SELECT json_group_array(json(groupe)) FROM (
      SELECT g.value AS groupe, g.key AS rang, 0 AS sous_rang
      FROM json_each(saisons.referentiel, '$.tarifs.groupes') g
      WHERE json_extract(g.value, '$.titre') <> 'Taïso et yoga'
      UNION ALL
      SELECT json_object('titre', 'Taïso', 'formules', (
               SELECT json_group_array(json(f.value)) FROM json_each(g.value, '$.formules') f
               WHERE json_extract(f.value, '$.id') NOT LIKE 'yoga%')),
             g.key, 1
      FROM json_each(saisons.referentiel, '$.tarifs.groupes') g
      WHERE json_extract(g.value, '$.titre') = 'Taïso et yoga'
      UNION ALL
      SELECT json_object('titre', 'Yoga', 'formules', (
               SELECT json_group_array(json(f.value)) FROM json_each(g.value, '$.formules') f
               WHERE json_extract(f.value, '$.id') LIKE 'yoga%')),
             g.key, 2
      FROM json_each(saisons.referentiel, '$.tarifs.groupes') g
      WHERE json_extract(g.value, '$.titre') = 'Taïso et yoga'
      ORDER BY rang, sous_rang
    )
  )),
  modifie_le = datetime('now')
WHERE EXISTS (
  SELECT 1 FROM json_each(saisons.referentiel, '$.tarifs.groupes') g
  WHERE json_extract(g.value, '$.titre') = 'Taïso et yoga'
    AND EXISTS (SELECT 1 FROM json_each(g.value, '$.formules') f WHERE json_extract(f.value, '$.id') LIKE 'yoga%')
    AND EXISTS (SELECT 1 FROM json_each(g.value, '$.formules') f WHERE json_extract(f.value, '$.id') NOT LIKE 'yoga%')
);
