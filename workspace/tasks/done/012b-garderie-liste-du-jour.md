# 012b — Garderie du mercredi : liste du jour de l'encadrant, photos

> Chantier : 012-CHT-garderie-mercredi

## Pourquoi

L'encadrant qui va chercher les enfants à la garderie doit savoir, sans doute possible, **quels
enfants récupérer** et **les reconnaître**, et pouvoir joindre un responsable. Aujourd'hui, il
reconstitue la liste depuis WhatsApp et ne connaît pas toujours les enfants de vue.

## Quoi

- **Liste du jour** (rôle `encadrant`, et bureau / admin), sur téléphone : le mercredi même, les
  enfants demandés (012a) par lieu de récupération, avec pour chacun la photo (si accord), la
  catégorie, les responsables qui peuvent le récupérer et les personnes autorisées, avec leur
  téléphone (appel en un geste).
- **Photo d'identification** d'un enfant, déposée par un responsable légal depuis son espace, ou
  par le bureau depuis la fiche de l'adhérent, **si l'accord « photo pour la garderie » est
  donné** : nouvel accord du dossier d'adhésion (saisi par le bureau) et des « Autorisations » de
  l'espace famille (oui / non, à tout moment). Photo réduite dans le navigateur avant l'envoi.
- **Personnes autorisées gérées par les familles** : un responsable qui peut *inscrire* l'enfant
  ajoute ou retire les personnes autorisées à le récupérer (aujourd'hui réservé au bureau).
- Aide intégrée (encadrant, familles, bureau), page « Données personnelles » et registre.

## Critères d'acceptation

- [x] Un encadrant voit, le mercredi même, la liste des enfants à récupérer par lieu, avec photo et contacts
- [x] Hors du mercredi, ni la liste ni les photos ne sont accessibles à l'encadrant (contrôlé côté API)
- [x] Un parent dépose, remplace ou retire la photo de son enfant depuis son téléphone
- [x] Sans accord « photo pour la garderie », aucune photo ne peut être déposée ni montrée ; retirer l'accord efface la photo
- [x] Un parent ajoute une personne autorisée à récupérer son enfant ; elle apparaît dans la liste de l'encadrant
- [x] Chaque consultation de la liste du jour est inscrite au journal des accès
- [x] Utilisable à 360 px

## Hors périmètre

- Pointage « récupéré » / « parti avec » et suivi en direct par le parent : **012c**
- Allergies et consignes du goûter : rien n'est collecté (arbitrage A12)

## Revue (2026-09-24) — décisions

1. **Stockage des photos** : dans la base D1 (rien à créer côté Cloudflare), photo réduite dans le
   navigateur (JPEG, 480 px au plus, 60 Ko au plus), incluse dans la sauvegarde chiffrée, effacée
   de la qualif. Servie par l'API, jamais mise en cache.
2. **Qui dépose** : un responsable légal (mère, père, tuteur) ou le bureau ; dans les deux cas,
   l'accord « photo pour la garderie » doit être donné (dossier d'adhésion, ou espace famille).
3. **Accès** : la liste avec photos et contacts n'est visible que **le mercredi même** (encadrant,
   bureau, admin) ; chaque consultation est journalisée (une entrée par personne et par jour).
   Hors production, un mercredi peut être choisi pour les essais.
4. **Personne non inscrite** au moment du départ : refus ; le parent l'ajoute depuis son espace.
5. Tranché sans question : photo effacée **un an** après son dépôt (à renouveler, les enfants
   changent), à l'anonymisation de l'enfant, ou quand l'accord est retiré ; photo montrée à
   l'encadrant seulement si l'accord de la **saison courante** est « oui ». Téléphone des
   personnes autorisées non affiché aux familles (inchangé) ; visible de l'encadrant et du bureau.

## Notes

- Dépend de 012a (demandes), 004 (liens, personnes autorisées), 019 (accords, journal, purge).
- Nouvelle table (photos) → listes de purge de la qualif, classement pour l'anonymisation (008).
