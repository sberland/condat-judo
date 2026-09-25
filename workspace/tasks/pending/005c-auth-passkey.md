# 005c — Passkey (Face ID / empreinte), optionnelle

> Chantier : [005-CHT-authentification](005-CHT-authentification.md)

## Pourquoi

Après une première connexion, se reconnecter d'un regard ou d'une empreinte, sans e-mail ni lien :
le moyen le plus simple et le plus sûr sur téléphone.

## Quoi

- Proposée (jamais imposée) après une connexion : « Activer Face ID / l'empreinte sur ce
  téléphone ».
- Connexion par passkey depuis `/connexion` ; gestion (retrait) dans l'espace.
- WebAuthn côté Worker (ex. `@simplewebauthn/server`), clés publiques rattachées à `users.id`.

## Critères d'acceptation

- [x] Un parent active la passkey en un geste et se reconnecte ensuite sans e-mail ni lien
- [x] Un parent qui refuse n'est plus sollicité à chaque visite

## Revue de spec (2026-09-25)

- **Quand** : réalisée maintenant, avant le code e-mail (005b, qui attend le nom de domaine) —
  décision du 2026-09-25 (« Maintenant »). Conséquence acceptée : une passkey est liée à l'adresse
  du site ; après le changement de domaine, chacun la réactivera (le lien reste toujours possible).
- **Proposition** : bandeau dans « Mon espace » après une connexion, si le navigateur sait utiliser
  le déverrouillage de l'appareil. « Non merci » est mémorisé **sur l'appareil** (pas sur le compte :
  un refus sur l'ordinateur ne doit pas empêcher de l'activer sur le téléphone).
- **Connexion** : bouton « Se connecter avec Face ID / l'empreinte » sur /connexion, en premier si
  la passkey a été activée sur cet appareil, sinon sous les explications du lien.
- **Gestion** : « Mes enfants » → « Connexion par Face ID / empreinte » (liste par appareil, retrait,
  activation) ; « Déconnecter tous ses appareils » (bureau) et la suppression du compte retirent
  aussi les passkeys.
- **Données** : clé publique, compteur, libellé de l'appareil, dates — aucune donnée biométrique.
  Registre et page « Données personnelles » mis à jour ; passkeys vidées dans la qualification.

## Hors périmètre

- Passkey comme seul moyen de connexion
