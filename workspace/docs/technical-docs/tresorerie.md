# Trésorerie — suivi des cotisations (spec 011)

## Contexte

Le trésorier doit savoir à tout moment qui a payé quoi et ce qui reste dû, enregistrer un chèque
depuis son téléphone et savoir quels chèques remettre en banque (paiement en 3 fois : chèques
remis à l'inscription, encaissés plus tard). Les montants dus viennent des dossiers d'adhésion
(010a), figés à l'enregistrement.

## Description / Flux

### Modèle (migration `0006_paiements.sql`)

| Table | Rôle |
| --- | --- |
| `paiements` | Ce que la famille remet : montant, mode (`cheque`, `especes`, `cb`, `virement`, `cheques_vacances`, `pass_sport`, `autre`), référence (n° de chèque, banque), `recu_le`, `encaisser_le` (chèque différé), `encaisse_le` (remis en banque), `saisi_par`, saison |
| `paiement_parts` | Répartition d'un paiement sur un ou plusieurs dossiers (`adhesion_id`, montant) ; somme des parts = montant ; supprimées avec le paiement |

Restant dû d'un dossier = `adhesions.montant_total` − somme de ses parts. Un dossier qui porte
des parts ne peut plus être supprimé (409 dans `DELETE /api/admin/adherents/:id/adhesion`).

### Familles

Pas de table « foyer » : `worker/familles.ts` regroupe les adhérents qui partagent un compte
(responsable légal via `liens`, ou compte de l'adhérent majeur via `adherents.user_id`) —
composantes connexes (union-find). Le calcul est fait à chaque lecture : il suit les
modifications de liens du bureau. Une famille est désignée dans l'URL par l'un de ses dossiers
(`/espace/tresorerie/familles/:adhesionId`).

### Règles partagées (`app/web/src/content/paiements.ts`, importé par le Worker)

- `echeancier` : comptant = tout à l'inscription ; en 3 fois = `echeance_1` à l'inscription,
  `echeance_2` et `echeance_3` aux dates du référentiel de la saison (`echeances3Fois`, spec 003 ;
  en 2026/2027 **provisoires** : 5 janvier et 5 avril, à confirmer par la trésorière).
- `exigible(dossier, jour)` : versements échus ; `situation(du, paye, exigible)` : restant,
  trop-perçu, retard, statut (`a_payer`, `partiel`, `solde`).
- `cumul` : situation d'une famille ou de la saison = **somme des situations des dossiers**
  (l'avance payée pour un enfant ne couvre pas le retard d'un autre).
- `repartir(montant, restants)` : au prorata du restant dû, au centime près ; excédent au premier
  dossier ; parts égales si rien n'est dû.
- Carte bancaire et virement : `encaisse_le` = date de réception (rien à remettre en banque).

### API

| Route | Accès | Rôle |
| --- | --- | --- |
| `GET /api/tresorerie` | trésorier, admin | Totaux de la saison, paiements à remettre en banque (non encaissés, échéance dépassée ou dans le mois), familles |
| `GET /api/tresorerie/familles/:id` | trésorier, admin | Famille : responsables (nom, téléphone), dossiers avec situation, paiements avec répartition |
| `GET /api/tresorerie/paiements` | trésorier, admin | Tous les paiements de la saison (export CSV) |
| `POST /api/tresorerie/paiements` | trésorier, admin | `{ paiements: [...] }` — un ou plusieurs (ex. 3 chèques), en un lot transactionnel |
| `PUT /api/tresorerie/paiements/:id/encaisse` | trésorier, admin | Remise en banque (date) ou annulation (`null`) |
| `DELETE /api/tresorerie/paiements/:id` | trésorier, admin | Suppression (parts en cascade) |
| `GET /api/famille/paiements` | connecté | Dossiers de ses enfants (et le sien) : situation, échéancier, versements — **sans référence** |

Validation : `validerPaiement` (`validation.ts`) — montant entier en centimes, mode connu, dates
ISO, parts non vides, sans doublon, somme = montant ; les dossiers doivent exister pour la saison.
Insertion des parts dans le même lot que le paiement : `(SELECT max(id) FROM paiements)` (le lot
D1 est une transaction).

### Écrans

| Route | Contenu |
| --- | --- |
| `/espace/tresorerie` | Totaux (dû, payé, reste, retard), « À remettre en banque », familles filtrables (en retard, à payer, partiel, soldées), exports CSV paiements / familles |
| `/espace/tresorerie/familles/$id` | Situation, responsables (téléphone), dossiers et échéancier, « Enregistrer un paiement » (montant proposé = reste, répartition automatique modifiable), « Enregistrer les 3 chèques de … », paiements reçus (remise en banque, suppression) |
| `/espace/famille` | Bloc « Cotisations » : par enfant, dû, payé, reste, échéancier, versements |
| Fiche adhérent (bureau) | Lien « Paiements de la famille » si l'utilisateur est trésorier ou admin |

## Points de vigilance

- **Minimisation** : le rôle `bureau` seul ne voit pas les paiements ; la trésorière a le rôle
  `tresorier` (et `bureau` si elle gère aussi les adhérents). Les familles ne voient jamais la
  référence d'un chèque.
- Les dates d'encaissement en 3 fois sont provisoires (`echeances3Fois.provisoire`) : l'écran le
  signale ; le bureau les corrige dans Saisons et tarifs dès la réponse de la trésorière.
- Qualif : la référence des chèques est pseudonymisée (`anonymisation-qualif.sql`).
- Les exports CSV contiennent des données personnelles : générés dans le navigateur, à garder sur
  un appareil du club.

## Références

- Worker : `app/src/worker/routes/tresorerie.ts`, `routes/famille.ts`, `familles.ts`, `validation.ts`
- Front : `pages/espace/TresoreriePage.tsx`, `pages/espace/TresorerieFamillePage.tsx`,
  `components/espace/FormulairePaiement.tsx`, `lib/paiements.ts`, `lib/csv.ts`
- Règles : `app/web/src/content/paiements.ts` (tests `paiements.test.ts`)
- RGPD : traitement « Cotisations et paiements » (`content/rgpd.ts`, registre)
