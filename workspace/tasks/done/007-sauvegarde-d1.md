# 007 — Sauvegarde de la base hors Cloudflare

## Pourquoi

Aujourd'hui, seule la fonction Time Travel de D1 protège les données (restauration sur 30 jours,
chez Cloudflare). Avant d'y mettre les données réelles des familles, il faut une sauvegarde
**indépendante** de Cloudflare, et un export avant chaque migration de schéma — comme sur le projet
de référence (StrategyHub, specs 008 / 013), transposé à GitHub.

## Quoi

- **Export quotidien** de la base prod (lecture seule) par un workflow GitHub Actions planifié.
- **Export avant migration** dans `deploy.yml` : si des migrations sont en attente, export d'abord ;
  tout échec bloque le déploiement.
- **Stockage chiffré**, hors du dépôt public : les exports contiennent des données personnelles →
  ⚠️ **jamais** en artefact public ni en fichier du dépôt.
- **Rétention** : 30 quotidiens + 1 mensuel sur 12 mois (comme la référence).
- **Procédure de restauration** documentée et **testée** (restauration vers la qualif).

## Critères d'acceptation

- [x] Un export quotidien est produit et conservé selon la rétention (1re exécution réelle le 2026-09-24)
- [ ] Un déploiement avec migration crée un export avant d’appliquer la migration — à constater au prochain tag (migration 0004)
- [x] Les exports sont chiffrés et inaccessibles publiquement (dépôt privé, age ; journaux sans contenu)
- [x] La restauration d’un export vers la qualif est documentée et a été testée (2026-09-24)

## Hors périmètre

- Plan de reprise complet (sauvegarde du code : déjà sur GitHub)

## Revue (2026-09-24) — décisions

- **Stockage** (arbitré par le porteur de projet) : **dépôt GitHub privé dédié**
  `sberland/condat-judo-sauvegardes`, exports **chiffrés avec age** (clé publique en variable
  GitHub, clé privée détenue hors ligne par le responsable seul).
- Choix appliqués : une **Release par sauvegarde** (supprimable → rétention réelle, contrairement
  à des commits que l'historique Git garderait) ; rétention en fonction pure testée
  (`app/src/outils/retention.ts`) ; jeton *fine-grained* limité au dépôt de sauvegarde ;
  restauration vers la **qualif** seulement, via `refresh-preview-db.ps1` (donc anonymisée, 008).
- Mise en place par le porteur de projet (ressources externes) : `installation.md` § « Sauvegarde
  de la base ». Doc : [`sauvegarde.md`](../../docs/technical-docs/sauvegarde.md).

## Notes

- Droits requis : aucun écran. Données personnelles : oui (exports complets) → chiffrement.
