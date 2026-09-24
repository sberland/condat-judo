# 016 — Aide intégrée à l'espace membres, adaptée au profil

## Pourquoi

Les parents et le bureau découvrent l'espace membres seuls, sur leur téléphone. Une aide
intégrée, qui ne montre que ce qui concerne chacun (un parent n'a pas à lire comment attribuer
des rôles), évite des questions au bureau et rassure (« que veut dire *peut récupérer* ? »).

## Quoi

- Page **« Aide »** dans Mon espace (`/espace/aide`) : rubriques thématiques en questions /
  réponses dépliables, **filtrées selon le profil** — tout compte connecté voit l'aide « famille » ;
  `bureau` y ajoute la saisie des adhérents, des responsables, des comptes et des liens de
  connexion ; `admin` voit tout, rôles compris. Les rôles à venir (`tresorier`, `encadrant`,
  `contenu`) auront leur rubrique avec leurs écrans.
- **Lien « Aide » sur chaque écran** de l'espace, vers la rubrique correspondante ; tuile « Aide »
  sur l'accueil de l'espace.
- **Textes dans le code** (`app/web/src/content/aide.ts`), source unique de l'aide de l'espace ;
  **toute spec qui modifie l'espace met l'aide à jour** (règle ajoutée à `workflow-dev-spe.md`).
  Le guide `users-docs/utilisation.md` renvoie vers l'aide intégrée pour l'espace.

## Critères d'acceptation

- [ ] Un parent ne voit que l'aide famille ; un membre du bureau voit en plus l'aide bureau ; un
  administrateur voit toutes les rubriques
- [ ] Depuis chaque écran de l'espace, un geste mène à la bonne rubrique
- [ ] Lisible et utilisable à 360 px
- [ ] Un test garantit le filtrage par profil et l'unicité des rubriques

## Hors périmètre

- Édition de l'aide depuis l'application (éventuellement avec la spec 014)
- Aide du site public (les pages publiques s'expliquent d'elles-mêmes ; `/connexion` explique
  comment se connecter)
