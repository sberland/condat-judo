# 026 — Site vitrine : réponses du club (horaires, dojo, Instagram)

## Pourquoi

Temps 1 de la démarche du 2026-09-30 : un site vitrine juste et à jour. Le bureau a répondu à une
partie du questionnaire (cf. [`notes/2026-09-30-reponses-club.md`](../../notes/2026-09-30-reponses-club.md)) :
on reporte les réponses fermes dans le site.

## Quoi

- **Horaires 2026/2027** (capture du club) : mercredi — mini-poussins 15 h-16 h, micro-poussins
  16 h-17 h, poussins à juniors 17 h-18 h, taïso 18 h-19 h ; vendredi — poussins à juniors
  18 h 30-19 h 30, taïso 19 h 30-20 h 30, judo adulte 20 h 30-21 h 30 ; yoga lundi 18 h-19 h et
  jeudi 18 h 15-19 h 15. Plus « à confirmer ».
- **Dojo** : nom « Dojo Alice Milliat » (adresse inchangée, confirmée).
- **Instagram** : compte `judo_condat`, nouveau champ facultatif du contenu « Dojo, réseaux et
  saison », affiché dans le pied de page et sur la page Contact.
- Migration de données (0018) pour la qualif et la future prod ; contenus initiaux mis à jour ;
  une version ajoutée à l'historique du contenu modifié.

## Critères d'acceptation

- [x] La page « Horaires & tarifs » affiche les horaires du club, sans mention « à confirmer »
- [x] Le dojo s'appelle « Dojo Alice Milliat » partout où son nom apparaît
- [x] Le lien Instagram apparaît dans le pied de page et sur la page Contact ; le club peut le modifier

## Revue de spec (2026-09-30)

- Déjà conformes, rien à changer : hors commune (Condat-sur-Vienne), siège publié, logo France
  Judo, page Facebook, catégories des compétitions.
- **Pas ici** : les bénévoles à ajouter à l'équipe (noms complets et accord de publication à
  recueillir ; le club les saisit lui-même dans « Contenu du site ») ; le jujitsu, encore à
  confirmer par le président (il reste présenté, sans horaire) ; les questions encore ouvertes
  du questionnaire.
- Pas de nouvelle table ; le nouveau champ vit dans le JSON du contenu (aucune donnée personnelle).
