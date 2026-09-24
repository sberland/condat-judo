# Registre des traitements — Condat-sur-Vienne Judo

> Registre de l'article 30 du RGPD, tenu par le club (responsable du traitement). Document
> **sans aucune donnée personnelle** (catégories seulement) : il peut vivre dans le dépôt public.
> À **valider par le bureau** ; à mettre à jour à chaque nouvelle fonctionnalité qui traite des
> données (compétitions, garderie, paiements…). Information des personnes : page
> « Données personnelles » du site (`app/web/src/content/rgpd.ts`, même contenu).
>
> ⚠️ **À COMPLÉTER** (réponses du club attendues, questionnaire du 2026-09-25) : contact pour
> l'exercice des droits, durée de conservation des adhérents, destinataires externes.

| | |
| --- | --- |
| **Responsable du traitement** | Condat-sur-Vienne Judo, association loi 1901 — RNA W872010702, siège 13 rue des Peupliers, 87920 Condat-sur-Vienne |
| **Représentant** | Le président de l'association |
| **Contact pour les droits** | **À COMPLÉTER** (de préférence une adresse du club) |
| **Délégué à la protection des données** | Aucun (non obligatoire pour l'association) |
| **Mis à jour le** | 2026-09-24 |

## 1. Adhésions et vie du club

| Rubrique | Contenu |
| --- | --- |
| Finalités | Inscriptions, licence, suivi des paiements, sécurité des enfants (qui peut les récupérer, qui prévenir) |
| Base légale | Exécution du contrat d'adhésion (art. 6.1.b) |
| Personnes concernées | Adhérents (dont mineurs), responsables légaux, personnes autorisées à récupérer un enfant |
| Données | Adhérent : identité, date de naissance, sexe, ceinture, n° de licence, adresse. Responsables : identité, e-mail, téléphone, lien et droits sur l'enfant. Personnes autorisées : identité, lien, téléphone. Dossier : formule, montant, mode et échéancier de paiement, type et date de réception de la formalité médicale |
| Données sensibles | **Aucune** : pas de donnée de santé (seulement « attestation reçue le … ») |
| Destinataires | Bureau du club (selon les rôles) ; responsables liés à l'enfant (fiche de l'enfant, nom des autres responsables) ; **À COMPLÉTER** (ex. France Judo pour la licence) |
| Sous-traitants | Cloudflare (hébergement, D1 en juridiction UE) ; GitHub (sauvegardes **chiffrées**, clé détenue par le club) |
| Transferts hors UE | Cloudflare et GitHub sont des sociétés américaines : données du site stockées dans l'UE ; sauvegardes illisibles sans la clé du club |
| Durée | Pendant l'adhésion, puis **À COMPLÉTER** (ex. 3 saisons) après la dernière adhésion ; ensuite suppression ou anonymisation (automatisation : spec 019) |

## 2. Autorisations et consentements

| Rubrique | Contenu |
| --- | --- |
| Finalités | Soins d'urgence ; droit à l'image (site, réseaux sociaux, presse) ; ajout au groupe WhatsApp du club |
| Base légale | Consentement (art. 6.1.a), donné par un responsable légal pour un mineur, retirable à tout moment ; soins d'urgence : intérêt vital (art. 6.1.d) |
| Données | Réponse (oui / non / non recueilli), date, auteur de la saisie |
| Durée | Jusqu'au retrait, et au plus la durée de conservation de l'adhérent |
| Remarque | Le formulaire papier 2026/2027 présentait le droit à l'image comme « accepté par l'inscription » : non valable, saisi « non recueilli » (spec 010) |

## 3. Espace membres (comptes et connexion)

| Rubrique | Contenu |
| --- | --- |
| Finalités | Accès des familles aux informations de leurs enfants ; gestion du club par le bureau |
| Base légale | Nécessaire au service demandé (art. 6.1.b) |
| Données | Compte : identité, e-mail, téléphone, rôles ; connexion : empreinte du jeton de session, dates |
| Durée | Session : 6 mois après la dernière visite ; lien de connexion : 7 jours ; compte : comme l'adhérent |
| Cookies | Un seul cookie de session, strictement nécessaire (pas de bandeau de consentement) |

## 4. Sauvegardes

| Rubrique | Contenu |
| --- | --- |
| Finalités | Restauration en cas d'incident |
| Base légale | Intérêt légitime (sécurité des données, art. 6.1.f) |
| Données | Copie de toute la base, **chiffrée** (age) |
| Durée | 30 sauvegardes quotidiennes, puis une par mois pendant un an ; avant migration : un an |
| Accès | Clé de déchiffrement détenue par le seul responsable du site ; restauration uniquement vers la qualification, anonymisée |

## Mesures de sécurité (toutes les activités)

- Accès au strict nécessaire par rôle (bureau, trésorier, encadrant…), contrôlé par l'API ; un
  responsable ne voit que les enfants auxquels il est lié.
- Connexion sans mot de passe (lien personnel à usage unique, session `HttpOnly`) ; jetons stockés
  sous forme d'empreinte seulement.
- Hébergement des données dans l'UE ; sauvegardes chiffrées hors de l'hébergeur.
- Site de qualification : copie **anonymisée** (spec 008), verrou d'accès Cloudflare Access.
- Aucune donnée personnelle dans le dépôt de code (public).

## Historique

| Date | Modification |
| --- | --- |
| 2026-09-24 | Création (spec 006) : adhésions, consentements, espace membres, sauvegardes |
