# Guide d'utilisation — Condat Judo

## Le site public

Le site est accessible à tous, sans compte : <https://condat-judo.sebastien-berland.workers.dev>

| Page | Contenu |
| --- | --- |
| **Accueil** | Présentation du club, les quatre disciplines, les valeurs du code moral, les infos pratiques |
| **Disciplines** | Judo (et éveil judo pour les 4-5 ans), jujitsu, taïso, yoga — accès direct à chaque discipline par les boutons en haut de page |
| **Le club** | Le professeur et le bureau, le dojo et l'itinéraire, le code moral complet, les partenaires, les liens utiles |
| **Règlement** | Le règlement intérieur, article par article : touchez un titre pour l'ouvrir |
| **Contact** | Écrire au club via Facebook, venir au dojo, prendre sa licence |

Sur téléphone, le menu s'ouvre avec le bouton en haut à droite (trois traits).

Pour ses visiteurs, le site ne dépose aucun cookie et ne collecte aucune donnée personnelle. Les
membres connectés reçoivent un seul cookie, strictement nécessaire à leur connexion.

## Se connecter

Réservé aux personnes qui ont un compte, créé par le bureau. Pas de mot de passe :

1. Le bureau vous envoie un **lien personnel** (WhatsApp ou SMS), valable 7 jours et une seule fois.
2. Touchez-le **depuis votre téléphone**, puis « Me connecter sur cet appareil ».
3. Vous restez connecté·e **6 mois** ; chaque visite prolonge ce délai. L'entrée « Mon espace »
   apparaît dans le menu.

Lien expiré ou perdu, nouveau téléphone : demandez un nouveau lien au bureau. Le lien est
personnel : ne le transférez pas, il ouvre une session sur votre compte. Pour vous déconnecter :
**Mon espace → Se déconnecter**. Le lien « Espace membres » en bas de chaque page rappelle la
marche à suivre.

## Mon espace

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
| **Connexion au site** (Comptes → Modifier, ou « Lien de connexion » sur un responsable) | « Créer un lien de connexion » puis « Envoyer sur WhatsApp » (au numéro du compte) ou « Copier le lien ». Un nouveau lien annule le précédent. « Déconnecter tous ses appareils » coupe l'accès d'un téléphone perdu. Seul un administrateur crée un lien pour un membre du bureau |

Deux parents séparés ont chacun leur propre compte et leurs propres droits sur l'enfant : aucun
n'a besoin de connaître l'e-mail ou le téléphone de l'autre.

## Site de qualification

La qualification (site de test, accès réservé) se distingue de la production par la mention
**« Qualif · »** devant le titre de l'onglet et par le badge « Preview / Qualif — pas la
production » en bas à droite de chaque page.

## Mettre à jour le contenu

Les textes du site (disciplines, équipe, règlement, partenaires, liens) sont regroupés dans un seul
fichier : `app/web/src/content/club.ts`. Ajouter ou retirer une discipline dans cette liste met à
jour tout le site (accroches, nombre de disciplines, pied de page) ; seul `app/web/index.html`
(référencement) est à reprendre à la main — un test le signale. Toute modification passe par le circuit habituel
(branche, revue en local, qualification, mise en production).
