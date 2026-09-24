# 009 — Compétitions : publication et inscription des enfants

## Pourquoi

C'est le **besoin d'origine** du projet. L'espace compétition de la fédération est complexe : une
personne du club centralise les inscriptions, et le recueil se fait sur un groupe WhatsApp
difficile à suivre. Objectif : le parent inscrit son enfant en quelques secondes depuis son
téléphone ; la personne du club a une liste propre à ressaisir sur le site fédéral.

## Quoi

- **Bureau** : créer une compétition — nom, date, lieu (adresse + lien d'itinéraire), catégories
  d'âge concernées (003), date limite d'inscription, informations pratiques (pesée, horaires,
  lien vers la page officielle) ; modifier, annuler, clôturer.
- **Lien partageable** vers la compétition, à poster sur WhatsApp (le groupe reste le canal de
  notification : « inscrivez vos enfants ici »).
- **Parent** : voit les compétitions ouvertes auxquelles **ses** enfants sont éligibles
  (catégorie calculée) ; inscrit ou désinscrit chaque enfant jusqu'à la date limite ; voit l'état.
- **Liste des inscrits** pour le bureau : nom, prénom, date de naissance, sexe, catégorie, grade,
  n° de licence — **copiable / exportable** (CSV) pour la ressaisie sur le site fédéral ; case
  « ressaisi sur le site fédéral ».
- **Contrôles** : licence de la saison et formalités médicales en règle (indicateurs, sans
  bloquer au début — à arbitrer), rappel des pièces à apporter.
- **Historique** par enfant : compétitions passées (et résultats plus tard ?).

## Critères d'acceptation

- [ ] Un parent inscrit un enfant à une compétition en moins de 3 gestes depuis le lien WhatsApp
- [ ] Un parent ne voit et n'inscrit que ses propres enfants, éligibles, avant la date limite
- [ ] Le bureau obtient la liste des inscrits prête à ressaisir (copie ou CSV)
- [ ] Une inscription après la date limite est refusée côté API
- [ ] Utilisable à 360 px

## Hors périmètre

- Inscription automatique sur le site fédéral (pas d'API connue : la ressaisie reste manuelle)
- Résultats et palmarès (proposition au backlog)

## Notes

- **Dépend de** : 003 (catégories), 004 (enfants, responsables), 005 (connexion des parents).
- Droits requis : `bureau` (créer, voir toutes les inscriptions) ; responsable avec la capacité
  *inscrire* sur l'enfant (inscrire / désinscrire).
- Données personnelles : identité des mineurs transmise à la fédération (finalité : inscription
  à la compétition) → registre (006).
- À arbitrer : bloquer l'inscription si licence ou formalités médicales manquantes, ou simple
  alerte pour le bureau ?
