# 019 — RGPD : exercice des droits outillé et purge automatique

## Pourquoi

La 006 pose l'information des familles et le registre ; les droits s'exercent pour l'instant en
écrivant au bureau, et la durée de conservation décidée par le club n'est pas encore appliquée
automatiquement. Cette spec outille le tout, pour que le bureau n'ait rien à faire à la main.

## Quoi

- **Export** : un responsable télécharge depuis son espace les données qui le concernent, lui et
  ses enfants (fichier lisible, ex. JSON ou PDF) ; l'administrateur peut en produire un pour une
  demande reçue par écrit.
- **Purge automatisée** : au-delà de la durée de conservation décidée (006), les adhérents inactifs
  et leurs responsables sans autre lien sont anonymisés (tâche planifiée), avec un rapport au
  bureau ; consentements expirés effacés.
- **Journal des accès sensibles** : qui a consulté ou modifié les coordonnées d'une famille (et,
  plus tard, les photos de la garderie), consultable par l'administrateur, conservé un an.
- **Retrait d'un consentement par la famille** depuis son espace (droit à l'image, WhatsApp).

## Critères d'acceptation

- [ ] Un responsable télécharge ses données et celles de ses enfants en un geste
- [ ] Un adhérent inactif depuis la durée décidée est anonymisé sans intervention
- [ ] L'administrateur voit qui a consulté ou modifié les coordonnées d'une famille
- [ ] Une famille retire son accord au droit à l'image depuis son espace

## Notes

- Dépend de 006 (durées décidées) et 010a (dossiers, consentements).
- Nouvelles tables (journal) → purge de la qualif et classement pour l'anonymisation (008).
