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

- [ ] Le trésorier enregistre un chèque en moins de 30 secondes, depuis son téléphone
- [ ] Le restant dû d'une famille (plusieurs enfants) est juste, réduction famille comprise
- [ ] Les échéances du mois à encaisser sont listées
- [ ] Un parent voit ce qu'il a payé et ce qui reste dû, sans voir les autres familles

## Hors périmètre

- Paiement en ligne (proposition HelloAsso : gratuit pour les associations, API + webhooks)
- Comptabilité complète de l'association

## Notes

- **Dépend de** : 003 (grille), 004 (foyers), 005 (connexion) ; s'appuie sur 010 quand il sera livré
  (en attendant, montants saisis par le bureau).
- Droits requis : `tresorier` / `admin` (tout) ; responsable (ses propres paiements).
- Données personnelles : données financières → accès restreint au trésorier, conservation
  selon les obligations comptables (registre 006).
