# 024 — Démo en qualification : comptes de démo et données d'exemple

## Pourquoi

Préparer la présentation du site au club (et s'y entraîner) : ouvrir la qualif depuis un seul
poste avec un compte parent, un compte administrateur et la vue publique, sur des données
d'exemple parlantes (événements, enfant avec photo, garderie en cours…). La qualif étant
recopiée de la prod et anonymisée à chaque déploiement, ces données doivent pouvoir être
rechargées à la demande.

## Quoi

- `deploy/demo-qualif.ps1` : charge un jeu de données **fictif** dans la qualif (ou en local),
  puis crée les liens de connexion des deux comptes de démo ; rappelle comment ouvrir les trois
  vues (un profil de navigateur par vue).
- `app/src/db/demo-qualif.sql` : le jeu de données, relançable (il supprime d'abord tout ce qui
  est rattaché aux comptes `@demo.test`), aux dates relatives au jour du chargement :
  - comptes : un administrateur, un parent (un enfant avec photo, co-responsable, personne
    autorisée), et quelques familles fictives sans connexion ;
  - dossiers 2026/2027 dans tous les états, paiements (dont 3 fois, chèques à encaisser) ;
  - événements : compétition ouverte (enfant inscrit), stage, repas (familles inscrites), fête,
    compétition passée ;
  - garderie : le prochain mercredi en cours de pointage, et le suivant ;
  - actualités : publique avec photo, réservée aux familles, brouillon.
- Photos : **illustrations dessinées** (jamais de photo réelle d'enfant, dépôt public).

## Critères d'acceptation

- [x] Depuis un poste, la qualif s'ouvre en parent, en administrateur et en public en même temps
- [x] Les écrans montrent des données d'exemple cohérentes (famille, événements, garderie, trésorerie, actualités)
- [x] Le script se relance sans erreur (avant la démo, après un déploiement)

## Revue de spec (2026-09-25)

- **Chargement** : script lancé à la demande, avant la démo (choix de l'utilisateur) ; pas de
  changement de la CI. À relancer après chaque déploiement de la qualif (qui la remet à zéro) et
  le jour de la démo (dates relatives, liens valables 7 jours).
- **Comptes** : parent et administrateur (l'administrateur voit tout : bureau, trésorerie, liste
  du mercredi) ; la vue publique n'a pas besoin de compte.
- **Trois vues sur un poste** : un profil de navigateur par vue (la session est un cookie par
  profil) ; chaque profil passe une fois le verrou Access de la qualif.
- **Garderie un autre jour qu'un mercredi** : hors production, l'encadrant choisit un mercredi à
  venir (spec 012b) ; le « prochain mercredi » des données est donc démontrable tous les jours.
- **Données personnelles** : tout est fictif (adresses en `@demo.test`, domaine réservé),
  illustrations dessinées. Jamais en production : le script ne propose que `local` et `preview`.
- **Accord** : chargement sur la qualif demandé explicitement par l'utilisateur le 2026-09-25.

## Hors périmètre

- Chargement automatique à chaque déploiement
- Comptes encadrant, trésorier ou bureau seuls
