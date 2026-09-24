# 015 — Vitrine : le yoga partout, titre d'onglet « Qualif »

## Pourquoi

Le yoga fait partie des activités du club (tarifs 2026/2027 en ligne), mais la vitrine parle
encore de « judo, jujitsu et taïso » et de « trois disciplines » : accroche de l'accueil, page
Disciplines, pied de page, titre d'onglet, référencement. Sa présentation, provisoire, était
masquée en production.

En qualification, rien ne distingue l'onglet du navigateur de celui de la production : on peut
confondre les deux sites.

## Quoi

- **Yoga** : présentation sobre et factuelle (postures, respiration, détente ; lundi et jeudi ;
  lien vers les tarifs), **visible en production** ; le club pourra l'affiner (spec 014).
- **Source unique** : les énumérations (« judo, jujitsu, taïso et yoga ») et le nombre de
  disciplines (« Quatre façons de pratiquer ») sont **déduits de la liste des disciplines** — plus
  de texte à reprendre à chaque ajout. Pied de page, titres de page, titre d'onglet par défaut.
- **Référencement** (`index.html`, lu avant le JavaScript) : titre et descriptions mis à jour ; un
  test vérifie qu'ils citent chaque discipline.
- Horaires provisoires : créneaux de yoga (lundi, jeudi), à confirmer comme les autres.
- **Titre d'onglet en qualification uniquement** : préfixe « Qualif · » ; le badge « Preview /
  Qualif — pas la production » en bas à droite est conservé.

## Critères d'acceptation

- [x] Le yoga apparaît en production : accueil (accroche, cartes), page Disciplines, pied de page
- [x] Plus aucune mention « trois disciplines » ni énumération sans le yoga (site, référencement)
- [x] En qualification, l'onglet affiche « Qualif · … » ; en production, aucun préfixe
- [x] Mise en page correcte à 360 px (titre de l'accueil plus long)

## Hors périmètre

- Horaires réels du yoga (en attente du club, comme les autres créneaux)
- Édition du contenu dans l'application (spec 014)
