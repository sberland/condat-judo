# 011 — Cotisations : suivi des paiements par le trésorier

## Pourquoi

« Paiement des licences : éventuellement en ligne (mais les solutions prennent un pourcentage), ou
a minima pour vérifier et valider le paiement effectué. » Aujourd'hui le suivi (chèques, espèces,
paiements en 3 fois, chèques vacances) se fait à la main. Le trésorier doit savoir, à tout moment,
qui a payé quoi et ce qui reste dû.

## Quoi

- **Montant dû** par adhérent et par saison, issu du dossier d'inscription (010) ou saisi par le
  bureau : participation, licence, suppléments, réduction famille.
- **Échéancier** : paiement comptant ou en 3 fois (montants de la grille, 003).
- **Encaissements** : date, montant, mode (chèque, espèces, CB, chèques vacances, Pass'Sport,
  autre), référence (n° de chèque), date d'encaissement prévue (chèques différés).
- **Statut** : à payer / partiellement payé / soldé ; retards d'échéance.
- **Vues** : tableau de bord du trésorier (total dû, encaissé, restant ; échéances du mois),
  fiche par famille ; le parent voit l'état de ses paiements.
- **Export** (CSV) pour la comptabilité de l'association.

## Critères d'acceptation

- [x] Le trésorier enregistre un chèque en moins de 30 secondes, depuis son téléphone
- [x] Le restant dû d'une famille (plusieurs enfants) est juste, réduction famille comprise
- [x] Les échéances du mois à encaisser sont listées
- [x] Un parent voit ce qu'il a payé et ce qui reste dû, sans voir les autres familles

## Hors périmètre

- Paiement en ligne (proposition HelloAsso : gratuit pour les associations, API + webhooks)
- Comptabilité complète de l'association

## Revue (2026-09-24) — décisions

1. **Un chèque pour plusieurs enfants** : saisi une fois depuis la fiche famille, **réparti** sur
   les dossiers des enfants au prorata de leur restant dû (répartition modifiable). Tables
   `paiements` (ce que la famille remet) et `paiement_parts` (répartition par dossier).
2. **Accès** : trésorier et administrateur ; chaque responsable voit dû, payé et reste de ses
   enfants, **sans la référence du chèque** ; le rôle « bureau » seul ne voit pas les paiements.
3. Tranché sans question (évident) : **famille** = dossiers d'adhérents partageant un responsable
   (calculée, pas de table foyer) ; montant dû = dossier 010a (pas de saisie libre) ; dates des 2e
   et 3e versements en 3 fois **provisoires** (5 janvier, 5 avril — question posée à la
   trésorière) ; carte bancaire et virement encaissés dès réception ; l'avance payée pour un
   enfant ne couvre pas le retard d'un autre.

## Réalisation

- Migration `0006_paiements.sql` ; référence des chèques pseudonymisée en qualif ; tables dans
  les listes de purge.
- Règles partagées écran / Worker (`content/paiements.ts`) : modes, échéancier, exigible,
  situation, cumul, répartition au centime ; regroupement en familles (`worker/familles.ts`).
- API `/api/tresorerie` (tableau de bord, fiche famille, paiements, remise en banque,
  suppression, export) et `/api/famille/paiements` ; un dossier payé ne se supprime plus.
- Écrans : Trésorerie (totaux, à remettre en banque, familles filtrables, exports CSV), fiche
  famille (dossiers, échéancier, enregistrer un paiement, « 3 chèques », paiements reçus),
  bloc « Cotisations » dans « Mes enfants », lien depuis la fiche d'un adhérent.
- Aide (profil trésorier, rubrique famille), traitement RGPD et registre, doc technique
  `tresorerie.md`.

## Notes

- **Dépend de** : 003 (grille), 004 (foyers), 005 (connexion) ; s'appuie sur 010 quand il sera livré
  (en attendant, montants saisis par le bureau).
- Droits requis : `tresorier` / `admin` (tout) ; responsable (ses propres paiements).
- Données personnelles : données financières → accès restreint au trésorier, conservation
  selon les obligations comptables (registre 006).
