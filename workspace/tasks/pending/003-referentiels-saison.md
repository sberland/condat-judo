# 003 — Saisons et référentiels (catégories, cours, tarifs)

## Pourquoi

Inscriptions, compétitions, garderie et paiements reposent tous sur les mêmes notions de saison :
catégories d'âge (définies par année de naissance et qui glissent chaque saison), disciplines et
cours, grille tarifaire. Les centraliser en base évite de les recoder à chaque fonctionnalité et
permet au bureau de préparer la saison suivante sans développement.

## Quoi

- **Saison** (table `saisons` déjà amorcée) : libellé, dates de début / fin, saison courante,
  ouverture des inscriptions.
- **Catégories d'âge par saison** : nom (micro-poussins, mini-poussins, poussins, benjamins,
  minimes, cadets, juniors, seniors…), années de naissance couvertes → la catégorie d'un enfant
  est **calculée** depuis sa date de naissance, jamais saisie.
- **Disciplines et cours** : judo, jujitsu, taïso, yoga ; créneaux (jour, heure, public) —
  alimente aussi la page « Horaires » de la vitrine.
- **Grades** (ceintures) : liste ordonnée, pour le suivi du grade de chaque judoka.
- **Grille tarifaire par saison** : formules (participation + licence), suppléments (passeport,
  hors commune), réductions (famille), échéancier en 3 fois.
- **Écrans bureau** : consulter / modifier ; **copier une saison** vers la suivante.

## Critères d'acceptation

- [ ] La catégorie d'un enfant né le JJ/MM/AAAA est calculée correctement pour une saison donnée
- [ ] Le bureau prépare la saison N+1 en copiant la saison N puis en ajustant années et tarifs
- [ ] La vitrine lit horaires et tarifs depuis ces référentiels (fin du contenu statique de 002)
- [ ] API protégée : lecture publique des horaires / tarifs ; écriture réservée au bureau

## Hors périmètre

- Inscription d'un adhérent (010), paiements (011)

## Notes

- **Dépend de** : 004 (rôles, pour les écrans bureau) et 005 (connexion). La lecture publique
  (vitrine) peut être livrée avant.
- Source des catégories : textes officiels France Judo de la saison (à vérifier chaque année).
- Droits requis : lecture publique (horaires, tarifs) ; écriture `bureau` / `admin`.
- Données personnelles : aucune.
- Nouvelles tables → listes de purge de la preview (cf. `workflow-deploy-spe.md`).
