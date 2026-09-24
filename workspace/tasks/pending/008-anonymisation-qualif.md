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

- [ ] Après un déploiement de la qualif, aucune donnée nominative réelle n'est lisible dans sa base
- [ ] Les catégories d'âge et les liens parent ↔ enfant restent cohérents
- [ ] Ajouter une colonne personnelle sans l'anonymiser fait échouer le déploiement de la qualif

## Hors périmètre

- Anonymisation de la prod (purge RGPD : spec 006)

## Notes

- À livrer **avant** les premières données réelles en prod (avec 006 et 007).
- Le verrou Access de la qualif reste en place (défense en profondeur).
