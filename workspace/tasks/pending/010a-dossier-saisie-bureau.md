# 010a — Dossier d'adhésion saisi par le bureau (saison 2026/2027)

> Chantier : [010-CHT-adhesion](010-CHT-adhesion.md)

## Pourquoi

Les formulaires d'inscription 2026/2027 ont été remis sur papier. Le bureau les ressaisit pour
avoir toutes les informations des adhérents et des familles sur le site — et valider, en
situation réelle, que la saisie est pratique avant de l'ouvrir aux familles (010b).

## Quoi

- **Dossier d'adhésion** par adhérent et par saison (nouvelle table) :
  - **formule** de la grille 2026/2027 (proposée selon la discipline et l'année de naissance),
    suppléments (passeport, hors commune), **réduction famille** proposée quand un autre enfant
    d'un même responsable a déjà un dossier cette saison ;
  - **montant figé** dans le dossier (détail + total) et **paiement** : mode (chèque, espèces, CB,
    autre), paiement en 3 fois (échéancier de la grille) ;
  - **formalités médicales** : type (attestation questionnaire de santé / certificat /
    attestation QS-SPORT) et date de réception — rien d'autre ;
  - **autorisation de soins d'urgence** : oui / non / non recueillie ;
  - **consentements** : droit à l'image (oui / non / **non recueilli**, par défaut) et groupe
    WhatsApp (oui / non) — chacun avec sa date et qui l'a saisi ;
  - **statut** calculé : « à compléter » (et ce qui manque) → « complet » → « validé » par le bureau.
- **Ceinture** : liste officielle (blanche, blanche-jaune, jaune, jaune-orange, orange,
  orange-verte, verte, verte-bleue, bleue, bleue-marron, marron, noire 1ᵉʳ à 5ᵉ dan), « sans
  objet » pour le taïso et le yoga — dans tous les écrans de l'adhérent.
- **Parcours de ressaisie rapide**, pensé pour enchaîner les dossiers papier : adhérent →
  responsables → dossier, sans revenir à la liste entre deux étapes.
- **Liste « Dossiers 2026/2027 »** : statut, ce qui manque, montant ; filtre « à compléter ».
- **Aide intégrée** : rubrique bureau « Dossiers d'adhésion » (règle de la spec 016).

## Critères d'acceptation

- [ ] Un dossier papier complet (adhérent, un ou deux responsables, formule, paiement) est
  ressaisi en moins de 3 minutes
- [ ] Le montant correspond à la grille 2026/2027 (suppléments, réduction famille, 3 fois)
- [ ] Le bureau voit d'un coup d'œil les dossiers incomplets et ce qui manque
- [ ] La ceinture se choisit dans la liste officielle
- [ ] Aucune donnée de santé ; chaque consentement est daté et attribué à qui l'a saisi

## Hors périmètre

- Saisie par les familles (010b), encaissements et relances (011), référentiels en base (003)
- Export pour la prise de licence fédérale (à voir avec 011)

## Réalisation (2026-09-24)

- Table `adhesions` (migration `0004`), règles partagées écran / Worker dans
  `app/web/src/content/adhesion.ts` ; montants recalculés et figés par le Worker.
- Fiche adhérent : bloc « Adhésion 2026/2027 » (formule préchoisie d'après l'âge, réduction famille
  et hors commune proposés, total en direct, « Saisir l'adhérent suivant ») ; formulaire
  « Responsables » ouvert d'emblée pour un mineur sans responsable.
- Écran `/espace/adhesions` : tous les adhérents, filtres par statut, manques, total.
- Consentements / autorisations : réponse datée et attribuée ; « à recueillir » non bloquant.
- Toute modification d'un dossier validé annule la validation.

## Notes

- **Pas de champ de texte libre** dans le dossier (risque d'y voir écrire des informations de
  santé) : cases et listes uniquement.
- Droits : `bureau` / `admin` en écriture ; les montants intéresseront `tresorier` (011).
- Nouvelle table → listes de purge de la preview, anonymisation (008).
- **Ressaisie réelle en prod** seulement après 006 (minimal), 007 et 008 (décision du chantier).
