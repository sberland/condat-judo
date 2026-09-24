# 018 — Accès direct à l'espace membres, badge de qualification lisible

## Pourquoi

- L'entrée « Mon espace » n'apparaît qu'une fois connecté, et sur mobile elle est cachée dans le
  menu : un parent ou un membre du bureau ne trouve pas d'emblée où se connecter ou revenir à
  son espace. Un visiteur n'a qu'un lien discret en bas de page.
- En qualification, le badge « Preview / Qualif — pas la production » (en bas à droite) masque le
  numéro de version du pied de page.

## Quoi

- **Bouton dans l'en-tête, toujours visible** (y compris sur mobile, à côté du menu, sans
  l'ouvrir) : « Mon espace » si l'on est connecté, « Espace membres » (page de connexion) sinon.
  Même logique pour le lien du pied de page.
- **Badge de qualification** : reste en bas à droite (décision du 2026-09-24) et affiche la
  version (« Preview / Qualif · v0.7.1 — pas la production ») ; une marge en bas de page évite
  qu'il masque la fin du pied de page. Idem en local (« Dev local »).

## Critères d'acceptation

- [ ] Depuis n'importe quelle page, un geste mène à l'espace (connecté) ou à la connexion (visiteur)
- [ ] Mobile à 360 px : bouton visible sans débordement
- [ ] En qualif, la version reste lisible (dans le badge et en bas du pied de page)

## Hors périmètre

- Nouvelle charte graphique de l'en-tête
