# Backlog — Condat Judo — Vue consolidée

**Mis à jour :** 2026-09-23

---

## Légende

### Types

| Type | Signification |
|---|---|
| `technique` | Refactoring, infra, dette technique, outillage |
| `feature` | Nouvelle fonctionnalité visible |
| `proposition` | Idée à affiner, pas encore de spec |

### Priorités

| Priorité | Signification |
|---|---|
| **P1** | Critique — deadline dure ou bloquant client |
| **P2** | Important — engagement client ou dépendance forte |
| **P3** | Souhaitable — valeur réelle mais pas de deadline |
| **P4** | Long terme — à garder en tête, pas d'engagement |

---

## Conventions

### Fichier

- Lien cliquable `[NNN-titre.md](pending/NNN-titre.md)` dès qu'un fichier spec existe dans `pending/`
- `—` tant qu'aucun fichier n'est créé (proposition)

### Numérotation

- Le numéro est attribué **à la création du fichier spec**, pas à la proposition
- Les propositions n'ont pas de numéro (`—` dans la colonne Fichier et dans les `#` des synthèses)
- **Prochain numéro disponible** : NNN+1 après le plus grand numéro dans `pending/` et `done/` — vérifier aussi le backlog pour éviter tout conflit

### Ajout d'une spec

1. Créer le fichier `pending/NNN-titre.md`
2. Ajouter la ligne dans le tableau principal (avec lien, en ordre numérique)
3. Ajouter dans la synthèse par priorité correspondante (avec le numéro)
4. Si la proposition existait déjà : remplacer `—` par le lien dans le tableau et le numéro dans les synthèses

### Livraison

1. `git mv workspace/tasks/pending/NNN-titre.md workspace/tasks/done/`
2. Retirer la ligne du tableau principal
3. Retirer de la synthèse par priorité
4. Mettre à jour `**Mis à jour :**` en tête de fichier

---

> Propositions issues de l'[expression du besoin](../docs/spec-fonctionnelle/expression-besoin.md).
> Priorités **provisoires** — à arbitrer avec le porteur de projet avant de créer les specs.

| Fichier | Scope | Type | Impact utilisateur | Effort estimé | Priorité | Date cible | Notes |
|---|---|---|---|---|---|---|---|
| — | Comptes & foyers | proposition | Élevé — prérequis de tous les modules parents | L | P1 | — | Adultes, enfants, lien parent ↔ enfant avec capacités (inscrire, récupérer), rôles club (admin, bureau, encadrant, parent), admin des comptes et invitations ; multi-enfants, parents séparés |
| — | Auth applicative | proposition | Élevé — « connexion simple = clé du succès » | L | P1 | — | Probable chantier. Décision reportée au démarrage ; piste : [réflexion auth](../notes/2026-09-23-reflexion-auth.md) (invitation + session longue + code email + passkey). Prérequis de tout espace privé ; Cloudflare Access n'est qu'un verrou de la qualif, jamais l'auth de l'app |
| — | Compétitions | proposition | Élevé — besoin d'origine | M | P1 | — | Publication (date, lieu, catégories), inscription par le parent, liste pour ressaisie fédération ; dépend de Comptes & foyers |
| — | Conformité RGPD | proposition | Élevé — obligatoire avant ouverture aux familles | M | P1 | — | Mentions légales, confidentialité, consentements (photo), export / suppression, durées de conservation, registre ; localisation UE des données |
| — | Garderie du mercredi | proposition | Élevé — remplace un fil WhatsApp confus | M | P2 | — | Demande du parent, liste du jour avec photo (encadrants seulement), pointage « récupéré » ; probable chantier |
| — | Saisons & référentiels | proposition | Moyen — socle des licences et compétitions | S | P2 | — | Saisons, catégories d'âge, grades ; table `saisons` déjà amorcée |
| — | Licences — suivi des paiements | proposition | Moyen — travail du trésorier | M | P2 | — | Mode (espèces, chèque, virement, Pass'Sport, HelloAsso), statut, validation ; pas de paiement en ligne en v1 |
| — | Anonymisation de la copie qualif | proposition | Moyen — RGPD (données d'enfants hors prod) | S | P2 | — | La preview reçoit une copie de la prod : pseudonymiser noms, contacts, photos lors de la recopie (en plus du verrou Access) ; à livrer avant les données réelles |
| — | Sauvegarde D1 hors-Cloudflare | proposition | Moyen — sécurité des données | S | P2 | — | Export quotidien + snapshot pré-migration vers GitHub ; à livrer avant d'héberger les données réelles (Time Travel 30 j en attendant) |
| — | Communication | proposition | Moyen — actualités et calendrier | M | P3 | — | Actualités, calendrier du club ; WhatsApp reste le canal de notification |
| — | Paiement en ligne HelloAsso | proposition | Faible à moyen | M | P4 | — | Gratuit pour les associations ; API + webhooks pour rapprocher automatiquement |
| — | Notifications push (PWA) | proposition | Faible | M | P4 | — | Sur iPhone : exige l'ajout du site à l'écran d'accueil |

---

## Synthèse par priorité

### P1 — Critique

- **—** — Comptes & foyers
- **—** — Auth applicative
- **—** — Compétitions
- **—** — Conformité RGPD

---

### P2 — Important

- **—** — Garderie du mercredi
- **—** — Anonymisation de la copie qualif
- **—** — Saisons & référentiels
- **—** — Licences — suivi des paiements
- **—** — Sauvegarde D1 hors-Cloudflare

---

### P3 — Souhaitable

- **—** — Communication

---

### P4 — Long terme

- **—** — Paiement en ligne HelloAsso
- **—** — Notifications push (PWA)
