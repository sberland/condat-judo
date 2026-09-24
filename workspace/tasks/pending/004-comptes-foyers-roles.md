# 004 — Comptes, adhérents, responsables légaux et rôles

## Pourquoi

Tout le site familles repose sur une question : **qui est le parent de quel enfant, et qui a le
droit de faire quoi pour lui** (l'inscrire, venir le chercher, être prévenu). Aujourd'hui, sur
WhatsApp, on ne le sait pas (parents séparés, numéros changés…). Il faut un modèle solide, par
**personne**, et des droits rattachés à `users.id` (jamais à l'e-mail).

## Quoi

- **Personnes** :
  - **adhérent** (pratiquant : enfant ou adulte) — identité, date de naissance, sexe, grade,
    n° de licence FFJudo ;
  - **compte** (`users`) — adulte qui se connecte (parent, adhérent majeur, bureau, encadrant).
- **Lien responsable ↔ adhérent**, avec pour chaque lien :
  - la qualité (mère, père, tuteur, autre) ;
  - des **capacités** : *inscrire* (compétitions, garderie), *être contacté*, *récupérer
    l'enfant* ;
  - plusieurs responsables par enfant (parents séparés), plusieurs enfants par responsable.
- **Personnes autorisées à récupérer** un enfant (sans compte : nom, lien, téléphone) — utile à
  la garderie (012).
- **Rôles club** (sur `users.id`) : `admin`, `bureau`, `tresorier`, `encadrant`, `contenu`
  (gestion du contenu du site, spec 014), et par défaut « famille » (droits dérivés des liens). Un
  compte peut cumuler des rôles.
- **Administration** (bureau) : créer / modifier adhérents et responsables, lier, désactiver ;
  **inviter** un responsable (e-mail → lien d'activation, cf. 005) ; saisie des adhérents de la
  saison en cours depuis les dossiers papier.
- **Espace famille** : un responsable voit et met à jour ses enfants et ses coordonnées.

## Critères d'acceptation

- [ ] Un enfant peut avoir deux responsables qui ne partagent ni e-mail ni téléphone
- [ ] Un responsable ne voit que les enfants auxquels il est lié (contrôlé côté API)
- [ ] Les droits s'appuient sur `users.id` et les liens, jamais sur l'e-mail
- [ ] Le bureau saisit un adhérent et ses responsables en moins de 2 minutes, sur mobile
- [ ] Supprimer un lien retire immédiatement les droits correspondants

## Hors périmètre

- Mécanisme de connexion (005), dossier d'inscription en ligne (010)
- Import en masse depuis un tableur (proposition au backlog)

## Revue de spec (2026-09-24) — décisions

Choix structurants tranchés par le porteur de projet :

1. **Rôles cumulables** : table `user_roles (user_id, role)` — `admin`, `bureau`, `tresorier`,
   `encadrant`, `contenu` ; la colonne provisoire `users.role` est supprimée (ses `admin` repris).
2. **Un responsable légal est un compte `users`**, créé par le bureau (nom, e-mail, téléphone),
   activé à sa première connexion (005) ; un parent qui ne se connecte jamais reste une fiche.
3. **Pas de table « foyer »** : la famille se déduit des responsables communs (parents séparés
   gérés naturellement).
4. **Livraison 004 puis 005** : tables et écrans en prod dès la 004, utilisables en local
   (utilisateur simulé) ; accessibles en prod quand la connexion (005) sera livrée.

Modèle retenu : `users` (+ `telephone`), `user_roles`, `adherents` (identité, date de naissance,
sexe, grade, n° de licence, adresse ; `user_id` pour un adhérent majeur qui a un compte),
`liens` (responsable ↔ adhérent : qualité + capacités *inscrire*, *récupérer*, *être contacté*),
`personnes_autorisees` (sans compte : nom, lien, téléphone).

Choix mineurs appliqués (réversibles) :

- Écritures protégées contre le CSRF par un en-tête exigé (`X-Condat-Judo`) sur toute requête
  d'écriture de l'API.
- Espace famille v1 : le responsable **consulte** ses enfants (fiche, responsables, personnes
  autorisées) et **met à jour son téléphone** ; la modification des fiches enfants par la famille
  viendra avec le dossier d'inscription (010).
- **Invitation par e-mail** (lien d'activation) reportée au chantier 005 : elle dépend du
  mécanisme de connexion. En 004, le bureau crée le compte ; il se relie à la première connexion.
- Suppression d'un adhérent **logique** (restaurable) ; suppression d'un compte logique aussi,
  avec garde-fous : pas soi-même, jamais le dernier administrateur.

Doc technique : [`comptes-adherents.md`](../../docs/technical-docs/comptes-adherents.md).

## Notes

- Un adulte adhérent est aussi un `user` s'il se connecte (`adherents.user_id`).
- Droits requis : `bureau` / `admin` pour l'administration ; responsable lié pour ses enfants.
- Données personnelles : identité et coordonnées des mineurs et de leurs responsables →
  minimisation, accès au strict nécessaire, durée de conservation (006).
- Nouvelles tables → listes de purge de la preview.
