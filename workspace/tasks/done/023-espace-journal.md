# 023 — Espace rangé par rubriques, journal des accès filtrable

## Pourquoi

Retours du 2026-09-25 : avec les fonctionnalités livrées, « Mon espace » aligne jusqu'à quinze
cartes pour un administrateur, sans ordre apparent ; et le journal des accès (spec 019) ne se
consulte qu'avec une recherche texte sur les 300 dernières entrées, ce qui ne permet pas de
répondre simplement à « qui a consulté quoi, quand ».

## Quoi

- **Mon espace** : cartes rangées en rubriques titrées, sur une seule page :
  Ma famille · Mercredi (encadrement) · Adhérents · Vie du club · Gestion. Une rubrique sans
  carte visible pour l'utilisateur n'apparaît pas ; un parent sans rôle ne voit que « Ma
  famille », sans titre.
- **Regroupements** : la carte « Aide » devient le bouton « Aide » de l'en-tête (comme sur les
  autres écrans) ; « Événements » (inscrire ses enfants) est dans « Ma famille » pour tous, y
  compris les membres du bureau, qui gardent « Événements : gestion » dans « Vie du club ».
- **Journal des accès** : filtres par période (du / au), par membre du bureau (liste de ceux qui
  apparaissent dans le journal) et par type d'action, combinables avec la recherche texte
  existante ; nombre d'entrées trouvées ; au-delà de 300, les plus récentes et une invitation
  à affiner.

## Critères d'acceptation

- [x] Un administrateur retrouve chaque carte dans une rubrique cohérente, sur un téléphone
- [x] Un parent sans rôle voit ses cartes sans rubrique superflue
- [x] L'administrateur filtre le journal par période, par membre du bureau et par type d'action

## Revue de spec (2026-09-25)

- **Rangement** : rubriques sur une page (choix de l'utilisateur), plutôt que des onglets qui
  cacheraient une partie des cartes.
- **Regroupements retenus** : aide dans l'en-tête, événements côté famille. Écartés : une seule
  carte garderie pour le bureau (un geste de plus le mercredi), adhérents et dossiers fusionnés
  (deux usages distincts) — les rubriques suffisent à les rapprocher.
- **Présentation** : une carte par rubrique, une ligne par écran (icône, titre, description) —
  plus compact sur téléphone que des cartes séparées ; deux colonnes de rubriques sur grand écran.
- **Journal** : dates en heure de Paris (bornes converties en UTC, heure de stockage) ; membre
  du bureau par son identifiant (`users.id`), pas par le nom ; types d'action = liste fermée du
  journal. Réservé à l'administrateur, comme aujourd'hui. Aucune donnée nouvelle.

## Hors périmètre

- Export du journal
- Personnalisation de l'ordre des cartes par l'utilisateur
