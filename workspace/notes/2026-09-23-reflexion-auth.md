# Réflexion — authentification des parents (2026-09-23)

> Première réflexion, **non tranchée** : la décision est reportée au démarrage du chantier auth
> (voir backlog). Sert de point de départ à la revue de spec.

## Contraintes tirées du besoin

1. **Mobile à 99 %**, arrivée depuis un lien partagé sur WhatsApp (navigateur intégré de WhatsApp
   ou navigateur par défaut).
2. **Connexion simple = clé du succès** : un parent qui oublie son mot de passe ne réessaie pas.
3. **Traçabilité par adulte** (qui a inscrit l'enfant, parents séparés, changements de numéro) :
   un compte **par personne**, pas un compte par famille.
4. **Moyens associatifs** : pas de coût à l'usage si possible.

## Cloudflare Access : bon pour démarrer, pas comme cible parents

- Plan gratuit Zero Trust limité à **50 utilisateurs**.
- Access protège un **hôte entier** : écran générique, en anglais, sans le branding du club.
- Adapté au démarrage (bureau uniquement) et à la preview. Le seam `resolveUser` rend la bascule
  indolore.

## Options de connexion

| Méthode | Mobile | Coût | Avis |
|---|---|---|---|
| Mot de passe | Friction, oublis ; il faut de toute façon un email de réinitialisation | 0 | ❌ |
| Lien magique email | Piège : le lien s'ouvre souvent dans le navigateur de l'appli mail → session dans le mauvais navigateur | envoi d'emails | ⚠️ |
| Code à 6 chiffres par email | Code saisi dans le même navigateur, saisie auto iOS | envoi d'emails | ✅ |
| SMS OTP | Naturel | ~0,05–0,08 €/SMS + fournisseur | ❌ association |
| WhatsApp OTP | Cohérent avec l'existant | payant + vérification Meta Business | ❌ |
| Passkey (Face ID / empreinte) | Excellent | 0 | ✅ en complément (nécessite une première connexion) |
| Google OAuth | Simple sous Android | 0 | ➕ option |
| Apple OAuth | Simple sous iOS | compte développeur 99 $/an | ➖ |
| Lien d'invitation nominatif | Clic et c'est fait | 0 | ✅ pour l'embarquement (usage unique, expiration courte) |

## Piste recommandée (à valider au chantier)

1. **Embarquement** : l'admin crée le foyer (adultes + enfants) et envoie à chaque parent un lien
   d'invitation personnel (WhatsApp ou email).
2. **Session longue** (plusieurs mois, glissante) : le parent ne se reconnecte presque jamais — le
   vrai levier de simplicité.
3. **Reconnexion** : code à 6 chiffres par email.
4. **Passkey** proposée après la première connexion (option).
5. Bureau et admins sur le même mécanisme ; retrait d'Access en prod à la bascule.

Réalisation à évaluer : **Better Auth** (plugins OTP email, passkey, invitations ; Workers + D1)
ou module maison. Envoi d'emails : **Brevo** (français, gratuit jusqu'à 300 emails/jour).

## Autres points liés

- **Paiement** : HelloAsso (plateforme française, gratuite pour les associations, API + webhooks) ;
  v1 = suivi manuel par le trésorier.
- **RGPD** : photo d'enfant = consentement du responsable légal, visible des seuls encadrants,
  stockage privé (R2 juridiction UE) ; certificat médical = donnée de santé → ne stocker que
  « fourni le … » ; cookie de session uniquement (strictement nécessaire → pas de bandeau) ;
  pages légales, registre des traitements, droits d'accès/suppression ; vérifier l'option de
  localisation UE de D1.
