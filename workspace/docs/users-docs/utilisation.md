# Guide d'utilisation — Condat Judo

## Le site public

Le site est accessible à tous, sans compte : <https://condat-judo.sebastien-berland.workers.dev>

| Page | Contenu |
| --- | --- |
| **Accueil** | Présentation du club, les trois disciplines, les valeurs du code moral, les infos pratiques |
| **Disciplines** | Judo (et éveil judo pour les 4-5 ans), jujitsu, taïso — accès direct à chaque discipline par les boutons en haut de page |
| **Le club** | Le professeur et le bureau, le dojo et l'itinéraire, le code moral complet, les partenaires, les liens utiles |
| **Règlement** | Le règlement intérieur, article par article : touchez un titre pour l'ouvrir |
| **Contact** | Écrire au club via Facebook, venir au dojo, prendre sa licence |

Sur téléphone, le menu s'ouvre avec le bouton en haut à droite (trois traits).

Le site ne dépose aucun cookie et ne collecte aucune donnée personnelle.

## Mon espace (ouverture avec la connexion au site)

Réservé aux personnes qui ont un compte, créé par le bureau. Il ouvrira en ligne avec la connexion
au site (prochaine étape) ; l'entrée « Mon espace » apparaît alors dans le menu.

**Pour les parents — Mes enfants** : la fiche de chaque enfant (âge, ceinture, n° de licence), ce
que vous pouvez faire pour lui (l'inscrire, venir le chercher, être prévenu), les autres
responsables et les personnes autorisées à le récupérer. Vous pouvez y mettre à jour votre
téléphone ; pour toute autre correction, adressez-vous au bureau.

**Pour le bureau** :

| Écran | Usage |
| --- | --- |
| **Adhérents** | Liste des pratiquants avec recherche ; « aucun responsable » signale une fiche à compléter |
| **Fiche d'un adhérent** | Identité (modifier, supprimer — une fiche supprimée reste restaurable), responsables légaux, personnes autorisées à récupérer l'enfant |
| **Ajouter un responsable** | Chercher un parent déjà enregistré (ex. pour un deuxième enfant) ou en créer un nouveau (nom, e-mail et/ou téléphone), puis choisir son lien avec l'enfant et ses droits : *peut inscrire*, *peut récupérer*, *prévenu par le club*. Si l'e-mail est déjà connu, le site propose de relier le compte existant |
| **Comptes** | Tous les adultes enregistrés : coordonnées, nombre d'adhérents liés, « compte activé » dès la première connexion. L'administrateur y attribue les rôles (bureau, trésorier, encadrant, gestion du site) |

Deux parents séparés ont chacun leur propre compte et leurs propres droits sur l'enfant : aucun
n'a besoin de connaître l'e-mail ou le téléphone de l'autre.

## Mettre à jour le contenu

Les textes du site (disciplines, équipe, règlement, partenaires, liens) sont regroupés dans un seul
fichier : `app/web/src/content/club.ts`. Toute modification passe par le circuit habituel
(branche, revue en local, qualification, mise en production).
