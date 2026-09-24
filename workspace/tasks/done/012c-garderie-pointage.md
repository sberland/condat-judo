# 012c — Garderie du mercredi : pointage, suivi en direct par le parent

> Chantier : 012-CHT-garderie-mercredi

## Pourquoi

Le parent doit être sûr que son enfant a bien été récupéré à la garderie, puis confié à une
personne autorisée à la fin du cours. Aujourd'hui, il attend un message WhatsApp, quand il vient.

## Quoi

- **Encadrant** (liste du jour, 012b) : pour chaque enfant, « Récupéré » à la garderie ou
  « Absent » (pas à la garderie) ; à la fin du cours, « Parti avec … » en choisissant parmi les
  personnes qui peuvent venir le chercher (responsables autorisés, personnes autorisées). Heure et
  auteur enregistrés ; « Annuler » corrige une erreur. Compteurs en tête de liste ; la liste se
  rafraîchit seule (plusieurs encadrants, personne ajoutée par un parent).
- **Parent** : « Garderie du mercredi » montre, le jour même, l'état de chaque enfant demandé
  (demandé, récupéré à …, absent de la garderie, parti avec … à …), mis à jour automatiquement.
- **Bureau** : l'état de chaque enfant dans la liste du mercredi.

## Critères d'acceptation

- [x] L'encadrant pointe « Récupéré » puis « Parti avec … » en un geste chacun, depuis son téléphone
- [x] « Parti avec » n'accepte qu'une personne autorisée pour cet enfant (contrôlé côté API)
- [x] Le parent voit l'état de son enfant se mettre à jour sans recharger la page
- [x] Le pointage n'est possible que le mercredi même (hors essais), par un encadrant, le bureau ou l'admin
- [x] Utilisable à 360 px

## Hors périmètre

- Notifications push ou SMS (proposition PWA au backlog) : l'état se lit dans l'espace

## Revue (2026-09-24) — décisions

1. Personne absente de la liste au moment du départ : **refus** ; l'encadrant appelle un
   responsable, qui ajoute la personne depuis son espace (012b) ; la liste se rafraîchit.
2. Tranché sans question : pointage enregistré sur la demande du mercredi (heure, auteur, nom de
   la personne au moment du départ, recopié) ; effacé avec la demande (un an) ; nom de la personne
   pseudonymisé dans la qualif. « Absent » : l'encadrant est invité à appeler un responsable ; le
   parent voit « absent de la garderie ». Mise à jour par interrogation toutes les 30 secondes,
   seulement le mercredi, page ouverte.

## Notes

- Dépend de 012a (demandes) et 012b (liste du jour, personnes autorisées).
- Dernière sous-spec du chantier 012 : clôture du chantier au merge.
