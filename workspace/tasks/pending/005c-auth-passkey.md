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

- [ ] Un parent active la passkey en un geste et se reconnecte ensuite sans e-mail ni lien
- [ ] Un parent qui refuse n'est plus sollicité à chaque visite

## Hors périmètre

- Passkey comme seul moyen de connexion
