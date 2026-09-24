# 012-CHT — Garderie du mercredi

## Pourquoi

Le mercredi, le club récupère des enfants à la garderie l'après-midi pour le goûter et un cours
de judo. C'est aujourd'hui géré sur WhatsApp : on ne sait pas quel parent de quel enfant répond,
les parents séparés et les changements de numéro compliquent tout. L'encadrant doit savoir, sans
doute possible, **quels enfants récupérer** et **les reconnaître**, et le parent doit être sûr que
son enfant a bien été récupéré.

## Sous-specs (dans l'ordre)

- [x] [`012a-garderie-demande.md`](../done/012a-garderie-demande.md) (v0.13.0) — le parent signale, pour un ou plusieurs mercredis, qu'un enfant
  doit être récupéré (ou annule) ; date limite (la veille ?) ; récurrence possible (tous les
  mercredis de la période)
- [ ] [`012b-garderie-liste-du-jour.md`](012b-garderie-liste-du-jour.md) — l'encadrant voit sur son téléphone la liste du jour :
  enfants, photo (si consentement), lieu de récupération, contacts des responsables, personnes
  autorisées à récupérer
- [ ] [`012c-garderie-pointage.md`](012c-garderie-pointage.md) — checklist « récupéré » à la garderie, puis « parti avec … » en
  fin de cours ; le parent voit l'état en direct

## Ordre et dépendances

- Dépend de **004** (enfants, responsables, capacité *récupérer*, personnes autorisées), **005**
  (connexion) et **006** (consentement photo, accès restreint).
- Photos : stockage **privé** (juridiction UE), visibles uniquement des encadrants du jour.

## Clôture (à remplir avant le dernier merge)

Résumé chantier pour CHANGELOG (Notes client + liste des ajouts/modifications) :

- 012a (v0.13.0) : demandes des familles au mercredi ou en série, délai, liste du bureau, réglages dans la saison.
- 012b : liste du jour de l'encadrant (le mercredi même, journalisée), photo d'identification sur accord,
  personnes autorisées gérées par les familles.
- 012c : pointage (récupéré / absent / parti avec), suivi en direct par les parents et le bureau.

Niveau de version retenu : MINEUR (une version par sous-spec, comme 012a)

## Notes — à arbitrer au démarrage

- Date limite de demande (la veille à 20 h ?) et gestion des demandes tardives.
- Garderie(s) concernée(s) : une seule école ou plusieurs lieux de récupération ?
- Allergies / consignes pour le goûter : cf. arbitrage A12 de la spec 010.
- Notification au parent quand l'enfant est récupéré : affichage dans l'app (pas de SMS) ;
  notifications push = proposition PWA au backlog.
- Droits requis : `encadrant` (liste du jour, pointage) ; responsable avec la capacité *inscrire*
  (demandes) ; `bureau` (suivi).
