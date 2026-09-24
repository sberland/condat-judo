# 005b — Reconnexion par code reçu par e-mail

> Chantier : [005-CHT-authentification](005-CHT-authentification.md)

⏸ **En attente** de la décision du club sur le nom de domaine et le fournisseur d'e-mails (A3).

## Pourquoi

Avec la 005a, un parent qui change de téléphone ou efface ses cookies doit redemander un lien au
bureau. Le code par e-mail le rend autonome : il saisit son e-mail et reçoit un code, qu'il tape
dans le même navigateur (pas de piège de navigateur, contrairement au lien magique).

## Quoi

- Page `/connexion` : e-mail → code à **6 chiffres**, valable **10 minutes**, **5 essais** au plus ;
  nombre d'envois limité par adresse et par heure ; réponse identique que l'e-mail soit connu ou
  non (pas d'énumération des comptes).
- Envoi transactionnel via le fournisseur retenu (A3), domaine d'envoi authentifié
  (SPF / DKIM / DMARC).
- **Qualif et local : aucun e-mail réel** (la qualif contient une copie des vrais comptes) — code
  affiché dans les journaux, envoi réel limité à une liste d'adresses de testeurs.

## Critères d'acceptation

- [ ] Un parent qui a changé de téléphone se reconnecte seul en moins d'une minute
- [ ] Le code arrive en boîte de réception (pas en spam) chez Gmail, Orange, Outlook, iCloud
- [ ] Un code faux, expiré ou déjà utilisé est refusé ; au-delà de 5 essais, un nouveau code est exigé
- [ ] Aucun e-mail ne part de la qualif vers une adresse hors liste de testeurs

## Hors périmètre

- Mot de passe, SMS

## Notes

- Prérequis : nom de domaine du club (backlog), DNS chez Cloudflare, fournisseur (Brevo gratuit
  ou Cloudflare Email Service sur plan payant) — cf. arbitrage A3 du chantier.
