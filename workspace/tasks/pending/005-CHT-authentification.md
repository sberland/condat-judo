# 005-CHT — Authentification applicative

## Pourquoi

« Un point important sera de permettre aux parents de se connecter simplement : c'est vraiment la
clé du succès » — et ce sera sur leur téléphone, depuis un lien WhatsApp. Aujourd'hui personne ne
peut se connecter en production : c'est le prérequis de tout espace privé (bureau comme familles).
Cloudflare Access n'est qu'un verrou de la qualification, jamais l'authentification de l'app.

## Sous-specs (dans l'ordre)

Proposition, **à trancher en revue au démarrage du chantier** (cf. décision du 2026-09-23 : « on
verra pour l'auth au moment où on démarre le chantier ») :

- [ ] `005a-auth-invitation-session.md` — invitation par lien personnel (usage unique, expiration
  courte) envoyé par le bureau ; session longue et glissante (plusieurs mois) ; déconnexion
- [ ] `005b-auth-code-email.md` — reconnexion par code à 6 chiffres envoyé par e-mail (nouveau
  téléphone, cookies effacés) ; envoi d'e-mails transactionnels
- [ ] `005c-auth-passkey.md` — passkey (Face ID / empreinte) proposée après la 1ʳᵉ connexion
  (optionnel)

Les fichiers de sous-specs sont rédigés au démarrage du chantier, après les arbitrages ci-dessous.

## Ordre et dépendances

- Dépend de **004** (comptes, rôles) : on n'invite que des personnes connues du bureau.
- Précède tout espace privé : 003 (écrans bureau), 009, 010, 011, 012.
- S'intègre au seam `resolveUser` : nouveau fournisseur `app` dans `identite.ts`, table
  `identites` existante (cf. [`identite-auth.md`](../../docs/technical-docs/identite-auth.md)).

## Arbitrages à rendre au démarrage

| # | Question | Piste (cf. [réflexion auth](../../notes/2026-09-23-reflexion-auth.md)) |
| --- | --- | --- |
| A1 | Méthode de connexion principale | Invitation + session longue + code e-mail ; pas de mot de passe ; pas de SMS (coût) |
| A2 | Réalisation | Better Auth (plugins OTP e-mail, passkey) ou module maison |
| A3 | Envoi d'e-mails | Brevo (gratuit jusqu'à 300 e-mails / jour) ou autre ; domaine d'envoi (lié au nom de domaine du club ?) |
| A4 | Connexion Google en option | Oui / non |
| A5 | Durée de session | 6 mois glissants ? |

## Clôture (à remplir avant le dernier merge)

Résumé chantier pour CHANGELOG (Notes client + liste des ajouts/modifications) :

- …

Niveau de version retenu : MINEUR / MAJEUR

## Notes

- Sécurité : protection CSRF sur toutes les routes d'écriture (cf. `identite-auth.md`), cookies
  `HttpOnly` / `Secure` / `SameSite`, limitation du nombre d'essais de code.
- RGPD : cookie de session strictement nécessaire → pas de bandeau de consentement.
