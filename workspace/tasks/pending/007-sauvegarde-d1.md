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

- [ ] Un export quotidien est produit et conservé selon la rétention
- [ ] Un déploiement avec migration crée un export avant d'appliquer la migration
- [ ] Les exports sont chiffrés et inaccessibles publiquement
- [ ] La restauration d'un export vers la qualif est documentée et a été testée

## Hors périmètre

- Plan de reprise complet (sauvegarde du code : déjà sur GitHub)

## Notes — à arbitrer en revue

- **Où stocker les exports ?** Le dépôt étant public, les artefacts GitHub Actions et les Releases
  sont exclus pour des données personnelles. Pistes : chiffrement (`age` / GPG, clé en secret
  GitHub) puis stockage dans un **dépôt privé dédié**, ou un stockage objet européen. À trancher.
- Réutiliser la logique de `backup-d1.mjs` de la référence (sélection de rétention testée).
- Droits requis : aucun écran. Données personnelles : oui (exports complets) → chiffrement.
