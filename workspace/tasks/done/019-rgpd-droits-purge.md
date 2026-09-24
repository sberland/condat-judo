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

- [x] Un responsable télécharge ses données et celles de ses enfants en un geste
- [x] Un adhérent inactif depuis la durée décidée est anonymisé sans intervention
- [x] L'administrateur voit qui a consulté ou modifié les coordonnées d'une famille
- [x] Une famille retire son accord au droit à l'image depuis son espace

## Revue (2026-09-24) — décisions

1. **Purge automatique, hebdomadaire** : tâche planifiée du Worker (déclencheur Cloudflare déclaré
   dans `wrangler.toml`, créé au déploiement — accord donné), production seulement, inactive tant
   que la durée de conservation est provisoire ; l'admin voit les adhérents concernés et
   l'historique.
2. **Accords** : la famille répond **oui ou non** (droit à l'image, WhatsApp) depuis son espace —
   règle aussi le recueil de la saison. Répondent les responsables légaux (mère, père, tuteur) ou
   l'adhérent majeur ; la dernière réponse compte, datée, à son nom.
3. Tranché sans question (évident) : export en **JSON** lisible (portabilité), sans référence de
   chèque ni coordonnées des autres responsables ; durée de conservation en **nombre de saisons**
   après la dernière adhésion ; journal = consultations et modifications des coordonnées (fiche
   adhérent, liste des comptes, fiche famille du trésorier), conservé un an, vidé en qualif ;
   membres du bureau jamais purgés ; fiche anonymisée non restaurable.

## Réalisation

- Migration `0007_rgpd_droits.sql` : `anonymise_le` (adhérents, comptes), `journal_acces`,
  `purges` ; classement pour la qualif, listes de purge.
- `purge.ts` (instructions SQL en un lot, testées sur SQLite), gestionnaire `scheduled`, cron du
  lundi ; `journal.ts` (middleware sur `/api/admin` et `/api/tresorerie`) ; `export.ts`.
- API famille (export, accords) et admin (export d'un compte, état RGPD, journal).
- Écrans : blocs Autorisations et Mes données (« Mes enfants »), Mon espace → Données
  personnelles (admin), Comptes → Exporter ses données.
- Page « Données personnelles », aide (famille, admin), registre, doc technique `rgpd-droits.md`.

## Notes

- Dépend de 006 (durées décidées) et 010a (dossiers, consentements).
- Nouvelles tables (journal) → purge de la qualif et classement pour l'anonymisation (008).
