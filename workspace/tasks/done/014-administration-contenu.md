# 014 — Administration du contenu du site

## Pourquoi

Aujourd'hui, chaque information du site (coordonnées, équipe, partenaires, textes des disciplines,
règlement, liens) est écrite dans le code (`app/web/src/content/club.ts`) : la moindre correction
demande un développement, une revue et une mise en production. Le club doit pouvoir **tenir son
site à jour lui-même**, avec un compte admin ou celui de la personne qui gère le contenu.

## Quoi

- **Rôle `contenu`** (spec 004) : la personne qui gère le site ; `admin` a aussi ces droits.
- **Écrans d'édition** (mobile d'abord), dans l'espace connecté :
  - coordonnées du club (e-mail, téléphone, réseaux sociaux, adresse du dojo) ;
  - équipe (professeur, encadrants, bureau) ;
  - disciplines : accroche, public, textes, encart ;
  - partenaires (nom, activité, adresse, logo) ;
  - règlement intérieur (articles) et liens utiles ;
  - mentions légales (identité de l'association, directeur de la publication).
- **Statut par contenu** : *publié* ou *à compléter* — un contenu « à compléter » garde le
  comportement actuel (badge en qualif, masqué en production).
- **Historique** : qui a modifié quoi et quand ; retour à la version précédente d'un contenu.
- **Aperçu** avant publication d'une modification (au minimum : voir la page publique après
  enregistrement, en qualif).
- **Reprise du contenu actuel** : le contenu de `content/club.ts` devient le contenu initial en
  base ; le code ne contient plus que la structure et les valeurs de repli.

## Critères d'acceptation

- [x] Une personne avec le rôle `contenu` modifie le téléphone du club depuis son téléphone, et le
  changement est visible sur le site public sans mise en production
- [x] Une personne sans ce rôle ne peut rien modifier (contrôlé côté API)
- [x] Chaque modification est tracée et réversible
- [x] Un contenu passé « à compléter » disparaît de la production et réapparaît avec son badge en qualif
- [x] Les pages publiques restent rapides (contenu mis en cache) et lisibles si l'API est lente

## Hors périmètre

- Horaires, tarifs, catégories : référentiels de saison, administrés dans la spec **003**
- Actualités et calendrier : spec **013**
- Éditeur de mise en page libre (on édite des champs, pas la structure des pages)

## Revue (2026-09-24) — décisions

1. **Stockage** : un document JSON par type de contenu (comme les saisons, spec 003), décrit champ
   par champ dans `content/contenu.ts` ; la même description sert à la validation (Worker) et à
   un éditeur générique. Historique : les 30 dernières versions par contenu, retour à une version.
2. **Cache et repli** : lecture publique revalidée par ETag ; dernier contenu gardé dans le
   navigateur ; première visite : attente de 1,5 s au plus, puis contenu initial du code.
3. **Statut** : « à compléter » par contenu (coordonnées, équipe, partenaires, règlement, liens),
   et par élément pour les disciplines et les partenaires ; toujours affichés : dojo, association.
4. **Aperçu** : « Voir sur le site » après enregistrement (minimum de la spec) ; le statut « à
   compléter » permet de relire un contenu sur le site de test avant de le publier.
5. Restent dans le code : nom et logo du club, code moral (texte officiel de France Judo).

## Réalisation

- Migration `0012_contenus.sql` (générée depuis `content/contenu-initial.ts`, identité vérifiée
  par test) ; tables dans les listes de purge et classées (008).
- API `/api/contenu` (public, ETag) et `/api/contenu/gestion` (rôles contenu, admin).
- Pages publiques branchées sur `useContenu()` : accueil, disciplines, le club, règlement,
  contact, mentions légales, données personnelles, horaires, en-tête, pied de page.
- Écrans « Contenu du site » (liste, formulaire, statut, historique) ; aide (profil contenu) ;
  registre ; doc technique `contenu-site.md`.

## Notes

- **Dépend de** : 004 (rôle `contenu`), 005 (connexion). Se combine avec 003 (même espace
  d'administration, mêmes composants de formulaire).
- Revue de spec à prévoir : stockage (une table par type de contenu, ou documents JSON versionnés
  par clé), cache de l'API publique, contenu de repli si l'API ne répond pas.
- Droits requis : `contenu` / `admin` (écriture) ; lecture publique.
- Données personnelles : noms de l'équipe et du bureau (publiés avec leur accord) ; aucun contact
  personnel sans consentement.
- Nouvelles tables → listes de purge de la preview.
