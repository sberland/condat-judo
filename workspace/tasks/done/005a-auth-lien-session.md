# 005a — Connexion par lien personnel et session longue

> Chantier : [005-CHT-authentification](../pending/005-CHT-authentification.md)

## Pourquoi

Personne ne peut encore se connecter en production : les écrans de la 004 (adhérents, comptes,
espace famille) y sont inaccessibles. Les parents arrivent depuis WhatsApp, sur leur téléphone, et
« une connexion simple est la clé du succès ». Le bureau remet à chaque adulte un **lien personnel** :
un geste suffit, puis la session dure **6 mois glissants**. Aucun e-mail n'est nécessaire, donc
aucune dépendance au nom de domaine du club (arbitrage A3 en attente).

## Quoi

- **Lien de connexion personnel**
  - créé par le bureau depuis un compte (écran Comptes, et responsable sur la fiche adhérent) ;
    usage unique, valable **7 jours** ; en créer un nouveau annule le précédent ;
  - partagé par **« Envoyer sur WhatsApp »** (vers le numéro du compte s'il est connu) ou
    **« Copier le lien »** ;
  - droits : `bureau` ou `admin` pour un compte sans rôle ; **`admin` seulement** pour un compte
    qui a un rôle ; créateur enregistré ;
  - jeton dans le **fragment** de l'URL (`/connexion#…`) : jamais transmis au serveur par un
    aperçu de lien, jamais journalisé ; **consommé seulement au clic** sur « Me connecter ».
- **Session**
  - cookie `__Host-`, `HttpOnly`, `Secure`, `SameSite=Lax` ; jeton aléatoire de 256 bits dont
    seule l'empreinte SHA-256 est en base ;
  - **6 mois glissants**, prolongée au plus une fois par jour à l'usage ;
  - **déconnexion** de l'appareil ; **« Déconnecter tous ses appareils »** pour le bureau ;
    supprimer un compte ferme ses sessions et annule ses liens.
- **Seam d'identité** : fournisseur `app` dans `resolveIdentite` (session → `users.id`) ; la
  première connexion crée la ligne `identites` (« compte activé »).
- **Premier administrateur en prod, testeurs en qualif** : script `deploy/lien-connexion.ps1`
  qui crée un lien pour un e-mail donné (lancé par le porteur de projet).
- **Qualification** : sessions et liens copiés de la prod supprimés à chaque recopie.
- **Visiteur non connecté** : page `/connexion` qui explique comment obtenir son lien ; lien
  discret « Espace membres » dans le pied de page.

## Critères d'acceptation

- [ ] Un parent se connecte en un geste depuis le lien reçu sur WhatsApp (iPhone et Android)
- [ ] Il est toujours connecté en revenant sur le site plus tard (session conservée)
- [ ] Un lien déjà utilisé, expiré ou remplacé est refusé avec un message clair
- [ ] L'aperçu du lien dans WhatsApp ne consomme pas le lien
- [ ] Un membre du bureau ne peut pas créer de lien pour un compte qui a un rôle
- [ ] Déconnexion, « déconnecter tous ses appareils » et suppression du compte coupent l'accès
  immédiatement
- [ ] Aucun jeton en clair en base ni dans les journaux

## Hors périmètre

- Code par e-mail (005b), passkey (005c), connexion Google (A4 : non)
- Liste « mes appareils connectés »

## Notes

- À vérifier en qualif sur de vrais téléphones : le navigateur ouvert depuis WhatsApp. Si c'est
  un navigateur intégré, la session y reste ; la page de connexion le signale.
- Local : le fournisseur `dev` reste actif ; une session réelle (cookie) est prioritaire sur lui.
