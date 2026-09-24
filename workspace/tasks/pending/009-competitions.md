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

## Revue (2026-09-24) — décisions

1. **Catégories** : table 2026/2027 **en dur** (`app/web/src/content/categories.ts`, partagée
   écran / Worker), termes du formulaire du club : micro-poussins 2021-2022, mini-poussins
   2019-2020, poussins 2017-2018, benjamins 2015-2016, minimes 2013-2014, cadets 2010-2012,
   juniors 2007-2009, seniors 2006 et avant ; en base avec la 003.
2. **Licence / formalité manquante** : **alerte** dans la liste du bureau, sans bloquer le parent.
3. **Page de la compétition** (lien WhatsApp) : informations **publiques** (date, lieu, infos
   pratiques) ; inscription **connectée**. Aucune donnée d'enfant publique.
4. **Le bureau peut inscrire** un enfant à la place de ses parents ; chaque inscription garde qui
   l'a faite.

## Réalisation

- Migration `0005_competitions.sql` (compétitions, inscriptions) ; tables classées pour
  l'anonymisation et ajoutées aux listes de purge.
- Catégories 2026/2027 partagées écran / Worker (`content/categories.ts`) ; `validerCompetition`.
- API publique (`/api/competitions`), famille (inscrire / désinscrire ses enfants : droit
  *inscrire*, date limite à Paris incluse, éligibilité) et bureau (CRUD, inscrits avec alertes,
  candidats, inscription à la place des parents, ressaisie).
- Pages publiques `/competitions` et `/competitions/$id` (menu « Compétitions ») ; espace bureau
  `/espace/competitions` (partage WhatsApp, copie / CSV, case « ressaisi ») ; historique sur les
  fiches enfant et adhérent ; tuiles de l'espace.
- Aide intégrée (rubriques famille et bureau), traitement « Compétitions » (page Données
  personnelles, registre), doc technique `competitions.md`, guide d'utilisation.
- Seed : trois compétitions fictives (ouverte, filles, date limite passée).

## Notes

- **Dépend de** : 004 (enfants, responsables), 005a (connexion des parents), 010a (dossier :
  licence, formalité), 006 (registre — branche construite sur la 006).
- Droits requis : `bureau` (créer, voir toutes les inscriptions) ; responsable avec la capacité
  *inscrire* sur l'enfant (inscrire / désinscrire).
- Données personnelles : identité des mineurs transmise à la fédération (finalité : inscription
  à la compétition) → registre (006).
- Bloquer l'inscription si licence ou formalités médicales manquantes, ou simple alerte pour le
  bureau ? → tranché en revue : **alerte** (décision 2).
