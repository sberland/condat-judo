# 008 — Anonymisation de la copie de qualification

## Pourquoi

À chaque déploiement de la qualif, la base de prod y est recopiée. Même derrière le verrou
Access, des **données d'enfants n'ont rien à faire hors de la production** (minimisation RGPD) :
les testeurs n'ont besoin que de données réalistes, pas réelles.

## Quoi

- Après l'import du snapshot prod dans la base preview (workflow `preview.yml` et
  `deploy/refresh-preview-db.ps1`), **pseudonymiser** : noms / prénoms, e-mails
  (`prenom.nom@exemple.test`), téléphones, adresses, dates de naissance (conserver l'année →
  catégories inchangées), photos supprimées, consentements conservés tels quels.
- Script SQL de pseudonymisation versionné, appliqué à **chaque** recopie, qui échoue bruyamment
  si une nouvelle colonne de données personnelles n'est pas couverte (liste explicite des colonnes
  traitées + contrôle).
- Garder les comptes de test du bureau utilisables en qualif (identités de test connues).

## Critères d'acceptation

- [x] Après un déploiement de la qualif, aucune donnée nominative réelle n'est lisible dans sa base
- [x] Les catégories d'âge et les liens parent ↔ enfant restent cohérents
- [x] Ajouter une colonne personnelle sans l'anonymiser fait échouer le déploiement de la qualif

## Hors périmètre

- Anonymisation de la prod (purge RGPD : spec 006)

## Réalisation (2026-09-24) — choix appliqués

- **Comptes avec un rôle conservés** (bureau, admin, encadrant…) : ce sont les testeurs, qui se
  connectent à la qualif avec leur vrai e-mail (`deploy/lien-connexion.ps1 -Cible preview`) ;
  leurs noms sont déjà publics. Idem pour la fiche d'un adhérent majeur qui a un rôle.
- **Pseudonymisation stable** (fonction de l'id) : prénoms / noms fictifs, e-mails
  `compte<id>@exemple.test`, téléphones fictifs, date de naissance ramenée au 15 juin de la même
  année, n° de licence et adresse fictifs (absences conservées), code postal et ville conservés
  (supplément « hors commune ») ; `identites.email_vu` vidé ; sessions et liens de connexion
  supprimés.
- **Contrôle en CI plutôt qu'au déploiement** : `app/src/db/donnees-personnelles.ts` classe
  chaque colonne (conservée / pseudonymisée / purgée) ; `anonymisation.test.ts` applique les
  migrations dans une vraie base SQLite (`node:sqlite`) et échoue si une colonne n'est pas
  classée, si une valeur réelle subsiste, ou si l'anonymisation n'est pas idempotente → la PR
  est bloquée avant même d'atteindre la qualif.
- Script : `app/src/db/anonymisation-qualif.sql`, exécuté par `preview.yml` et
  `deploy/refresh-preview-db.ps1` après les migrations (remplace la purge des sessions de la 005a).

## Notes

- À livrer **avant** les premières données réelles en prod (avec 006 et 007).
- Le verrou Access de la qualif reste en place (défense en profondeur).
