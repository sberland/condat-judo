# 021 — Événements du club : compétitions, stages, rencontres, repas…

## Pourquoi

Retours du club (2026-09-24) : « Compétitions » devient « Événements ». Le club y annonce ses
compétitions, mais aussi ses stages, rencontres, repas, fêtes… C'est le calendrier du club (celui
prévu par la spec 013, qui garde les actualités et l'abonnement agenda).

## Quoi

- **Type d'événement** : compétition, stage, rencontre, repas, fête du club, autre (pictogramme et
  libellé sur les listes et les pages).
- **Inscription au choix du bureau**, pour chaque événement :
  - *aucune* : information seule ;
  - *enfants* : comme les compétitions (catégories facultatives hors compétition : toutes par
    défaut) ; une compétition est toujours de ce mode, catégories obligatoires ;
  - *famille* : le responsable inscrit sa famille avec le nombre d'adultes et d'enfants (ex. repas).
- **Heure** facultative.
- Menu, pages, espace, aide : « Événements » ; adresses `/evenements` (les anciennes adresses
  `/competitions` redirigent). La liste à ressaisir sur le site fédéral et les alertes (licence,
  dossier, formalité) restent propres aux compétitions.

## Critères d'acceptation

- [ ] Le bureau publie un repas avec inscription de la famille ; un parent inscrit 2 adultes et 3 enfants, puis modifie ou annule
- [ ] Le bureau publie un stage ouvert à tous les enfants, et un événement sans inscription
- [ ] Les compétitions fonctionnent comme avant (catégories, date limite, liste fédérale, alertes)
- [ ] Le public voit les événements à venir, filtrables par type ; les anciens liens `/competitions/…` fonctionnent
- [ ] Utilisable à 360 px

## Revue (2026-09-24) — décisions

1. Inscriptions au choix du bureau (aucune / enfants / famille avec nombre de participants).
2. Un seul calendrier : les événements sont le calendrier du club ; la 013 garde les actualités
   et construira l'abonnement agenda à partir des événements.
3. Menu : Accueil · Le club · Disciplines · Horaires & tarifs · **Événements** · Règlement · Contact.
4. Tranché sans question : table `competitions` conservée (colonnes `type`, `inscription`,
   `heure`) — nom historique documenté ; inscriptions des familles dans une nouvelle table,
   effacées un an après l'événement.

## Notes

- Dépend de 009 (compétitions). Nouvelle table → purge de la qualif, classement (008).
