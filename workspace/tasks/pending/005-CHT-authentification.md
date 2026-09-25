# 005-CHT — Authentification applicative

## Pourquoi

« Un point important sera de permettre aux parents de se connecter simplement : c'est vraiment la
clé du succès » — et ce sera sur leur téléphone, depuis un lien WhatsApp. Aujourd'hui personne ne
peut se connecter en production : c'est le prérequis de tout espace privé (bureau comme familles).
Cloudflare Access n'est qu'un verrou de la qualification, jamais l'authentification de l'app.

## Sous-specs (dans l'ordre)

- [x] [`005a-auth-lien-session.md`](../done/005a-auth-lien-session.md) — lien de connexion personnel
  remis par le bureau (WhatsApp), session de 6 mois glissants, déconnexion. **Sans e-mail** :
  livrable sans attendre le nom de domaine
- [ ] [`005b-auth-code-email.md`](005b-auth-code-email.md) — reconnexion autonome par code à 6
  chiffres reçu par e-mail ; envoi d'e-mails. **Attend la décision du club** sur le domaine (A3)
- [x] [`005c-auth-passkey.md`](005c-auth-passkey.md) — passkey (Face ID / empreinte) proposée
  après la première connexion (optionnelle)

## Ordre et dépendances

- Dépend de **004** (comptes, rôles) : on n'invite que des personnes connues du bureau.
- Précède tout espace privé : 003 (écrans bureau), 009, 010, 011, 012.
- S'intègre au seam `resolveUser` : nouveau fournisseur `app` dans `identite.ts`, table
  `identites` existante (cf. [`identite-auth.md`](../../docs/technical-docs/identite-auth.md)).

## Arbitrages (revue du 2026-09-24)

Pistes de départ : [réflexion auth](../../notes/2026-09-23-reflexion-auth.md).

| # | Question | Décision |
| --- | --- | --- |
| A1 | Méthode de connexion | **Lien personnel remis par le bureau** (usage unique, 7 jours) + **session longue** ; reconnexion autonome par **code à 6 chiffres par e-mail** ; passkey en option. Ni mot de passe, ni SMS (coût), ni lien magique par e-mail (session ouverte dans le navigateur de l'appli mail) |
| A2 | Réalisation | **Module maison** : sans mot de passe, les briques sont simples (jeton aléatoire haché, cookie `HttpOnly`, code à essais limités) et s'intègrent directement à `users` / `identites` / `user_roles`. Better Auth écarté : ses propres tables d'utilisateurs doubleraient les nôtres |
| A3 | Envoi d'e-mails | **En attente du club** (nom de domaine). Constat : une authentification SPF/DKIM/DMARC du domaine d'envoi est indispensable ; Brevo gratuit (300 e-mails/jour) ; Cloudflare Email Service en bêta publique depuis 04/2026, plan Workers payant + DNS chez Cloudflare. La 005a n'envoie aucun e-mail |
| A4 | Connexion Google | **Non** pour l'instant (projet Google Cloud, écran de consentement, second chemin de connexion) ; ajoutable plus tard comme fournisseur derrière le seam |
| A5 | Durée de session | **6 mois glissants** ; le bureau peut déconnecter un compte à distance |

Points relevés en revue (appliqués dans la 005a) :

- **Aperçus de liens** : WhatsApp ouvre les liens pour en faire un aperçu → le jeton est placé
  dans le fragment de l'URL (jamais envoyé au serveur) et n'est consommé qu'au clic sur un bouton.
- **Qualification** : elle contient une copie des vrais comptes → aucun e-mail réel n'en part
  (005b) ; les sessions et liens copiés de la prod y sont supprimés à chaque recopie.
- **Usurpation** : un lien connecte *à la place* de la personne → le bureau crée des liens pour
  les comptes famille, **seul un administrateur** pour un compte qui a un rôle ; créateur tracé.

## Clôture (à remplir avant le dernier merge)

Résumé chantier pour CHANGELOG (Notes client + liste des ajouts/modifications) :

- …

Niveau de version retenu : MINEUR / MAJEUR

## Notes

- Sécurité : protection CSRF sur toutes les routes d'écriture (cf. `identite-auth.md`), cookies
  `HttpOnly` / `Secure` / `SameSite`, limitation du nombre d'essais de code.
- RGPD : cookie de session strictement nécessaire → pas de bandeau de consentement.
