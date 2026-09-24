# Sauvegarde de la base de prod (spec 007)

## Contexte

La D1 de prod porte les données des familles (dont des mineurs). La fonction Time Travel de D1
(restauration à un instant des 30 derniers jours) reste chez Cloudflare : une sauvegarde
**indépendante** est exigée avant d'héberger des données réelles (décision du 2026-09-24). Le
dépôt du projet étant **public**, ni ses artefacts ni ses Releases ne peuvent recevoir un export.

Choix : export **chiffré** (age, clé publique) déposé en **Release** d'un dépôt GitHub **privé**
dédié ; la clé privée n'est détenue que par le responsable (hors ligne).

## Description / Flux

```text
GitHub Actions (dépôt public, secrets)
  sauvegarde.yml (chaque nuit, 02 h 30 UTC)   deploy.yml (tag, s'il y a des migrations en attente)
        └────────────────┬───────────────────────────────┘
                         ▼
          deploy/sauvegarde-d1.sh <nom>
            wrangler d1 export condat-judo --remote   (LECTURE SEULE)
            gzip -9 → age -r $SAUVEGARDE_CLE_PUBLIQUE → condat-judo-<nom>.sql.gz.age
            gh release create <nom> --repo sberland/condat-judo-sauvegardes   (+ contrôle)
                         ▼
          Rétention (sauvegarde.yml) : app/src/outils/retention.ts (testé)
            quotidienne-* : 30 dernières + la 1re de chaque mois sur un an
            avant-migration-* : un an · autre nom (manuelle) : jamais supprimée

Restauration (poste du responsable, clé privée) : deploy/restaurer-sauvegarde.ps1
  gh release download → age -d → gunzip → refresh-preview-db.ps1 -SnapshotPath
  → purge + import + migrations + ANONYMISATION (008) dans la QUALIF
```

| Élément | Où |
| --- | --- |
| Dépôt de sauvegarde | `sberland/condat-judo-sauvegardes` (privé), une Release par sauvegarde |
| Clé publique age | variable GitHub `SAUVEGARDE_CLE_PUBLIQUE` (pas un secret) |
| Jeton | secret `SAUVEGARDE_TOKEN` : *fine-grained*, seul dépôt de sauvegarde, Contents R/W, 1 an |
| Clé privée | poste / gestionnaire de mots de passe du responsable — **jamais** dans GitHub |

## Points de vigilance

- **Perte de la clé privée = sauvegardes illisibles** : deux exemplaires hors ligne.
- **Journaux publics** (dépôt public) : les scripts n'affichent que des tailles et des noms,
  jamais le contenu ; les fichiers en clair ne vivent que dans un dossier temporaire du runner.
- **Avant migration** : `deploy.yml` sauvegarde si `wrangler d1 migrations list --remote` liste
  des fichiers `.sql` en attente ; **tout échec arrête le déploiement** (secrets absents
  compris) → configurer la sauvegarde avant le premier déploiement qui migre.
- **Jeton à renouveler** chaque année (expiration du *fine-grained token*) : sinon la sauvegarde
  quotidienne échoue (notification d'échec GitHub Actions) et les déploiements avec migration
  aussi.
- **Workflows planifiés** : ne tournent que depuis `main`, et GitHub les suspend après 60 jours
  sans activité sur le dépôt — un commit ou une relance manuelle les réactive.
- **Restauration** : toujours vers la qualif (qui anonymise). Un sinistre en prod se traite
  d'abord avec D1 Time Travel (`wrangler d1 time-travel`), à la main et en connaissance de cause.
- **Rétention et Git** : chaque sauvegarde est un fichier de Release (supprimable), pas un commit
  (l'historique Git conserverait tout).

## Références

- Scripts : `deploy/sauvegarde-d1.sh`, `deploy/restaurer-sauvegarde.ps1`,
  `app/src/outils/retention.ts` (+ `retention-cli.ts`, `retention.test.ts`)
- Workflows : `.github/workflows/sauvegarde.yml`, `.github/workflows/deploy.yml`
- Mise en place : [`installation.md`](../install/installation.md) § « Sauvegarde de la base »
- age : <https://github.com/FiloSottile/age>
