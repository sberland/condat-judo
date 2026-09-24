# 002 — Vitrine : tarifs et disciplines de la saison 2026/2027

## Pourquoi

La page « Horaires et tarifs » de la vitrine est provisoire (masquée en production). Le formulaire
d'inscription papier 2026/2027 donne les **vrais tarifs** et révèle une discipline absente du site
(**yoga**, lundi et jeudi). Gain rapide : les familles trouvent les tarifs sur le site.

## Quoi

- Remplacer les tarifs provisoires par la grille 2026/2027 (cf. [expression du besoin](../../docs/spec-fonctionnelle/expression-besoin.md#complément-2026-09-24--formulaire-dinscription)) :
  judo par tranche (micro/mini-poussins, poussins à juniors, adulte), taïso, yoga (lundi **ou**
  jeudi / lundi **et** jeudi), en distinguant participation à l'activité et licence.
- Suppléments et réductions : passeport, résident hors commune, réduction famille (2ᵉ licence).
- Modes de paiement et paiement en 3 fois (échéancier par formule).
- Ajouter le **yoga** aux disciplines (page Disciplines + accueil) — texte à fournir par le club.
- Horaires : restent provisoires tant que le club ne les a pas fournis (seuls « lundi » et
  « jeudi » sont connus, pour le yoga).
- Passer `TARIFS.provisoire` à `false` → la page devient visible en production (horaires masqués
  tant qu'ils restent provisoires).

## Critères d'acceptation

- [ ] Grille tarifaire 2026/2027 affichée, lisible à 360 px (tableaux → cartes sur mobile)
- [ ] Montants cohérents : sous-total = participation + licence ; échéancier en 3 fois = sous-total
- [ ] Yoga présent dans les disciplines (ou masqué si le club ne fournit pas de texte)
- [ ] Page « Horaires et tarifs » visible en production avec les tarifs, sans horaires provisoires

## Hors périmètre

- Calcul du montant d'une inscription (spec 010)
- Grille administrable par le bureau (spec 003) — ici, contenu statique dans `content/club.ts`

## Revue de spec (2026-09-24) — décisions

- Licence : montants **tels que sur le formulaire du club** (46 € judo, 43,80 € taïso / yoga),
  cohérence à confirmer avec le club — un seul endroit à corriger (`content/club.ts`).
- Passeport : présenté comme **« recommandé pour les compétiteurs »** (arbitrage A2 de la spec 010).
- Tranches d'années : celles du formulaire (grille officielle : spec 003).
- Yoga : discipline **provisoire** (visible en qualif, masquée en prod) tant que le club n'a pas
  fourni son texte ; ses **tarifs**, eux, sont publiés.
- Horaires toujours provisoires → en production, le menu et la page s'intitulent « Tarifs ».
- Droits requis : aucun. Données personnelles : aucune. Mobile : grilles en cartes.

## Notes — points relevés à la rédaction

- **Licence 46 € (judo) vs 43,80 € (taïso / yoga)** sur le formulaire : deux montants pour la même
  licence FFJDA. Erreur de saisie, ou licence différente selon la discipline ? À vérifier avec le
  club et le tarif fédéral 2026/2027.
- **Passeport « obligatoire à partir de poussin »** : les textes officiels France Judo 2026/2027
  demandent en compétition le passeport sportif **ou tout autre justificatif d'identité**. Le
  présenter comme « recommandé pour les compétiteurs » ? (cf. spec 010, arbitrage A2)
- **Tranches d'années de naissance** : à confirmer avec la grille officielle des catégories
  2026/2027 (spec 003).
- Droits requis : aucun (contenu public). Données personnelles : aucune.
