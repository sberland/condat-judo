# 010b — Dossier d'adhésion rempli en ligne par les familles

> Chantier : [010-CHT-adhesion](010-CHT-adhesion.md)

## Pourquoi

Fin des formulaires papier : pour les inscriptions 2027/2028, chaque famille remplit le dossier
de ses enfants depuis son téléphone, pré-rempli à partir de la saison précédente (ressaisie 010a).

## Quoi

- Le dossier de la 010a, rempli par un responsable lié (ou l'adhérent majeur), étape par étape
  sur mobile, **pré-rempli** d'une saison sur l'autre (à confirmer).
- Consentements recueillis directement auprès du responsable (droit à l'image, WhatsApp),
  autorisation de soins d'urgence, acceptation du règlement et information assurance, mention
  d'information RGPD.
- Le bureau valide les dossiers (liste de la 010a).

## Critères d'acceptation

- [x] Un parent remplit le dossier de deux enfants depuis son téléphone, sans ressaisir ses coordonnées
- [x] Une réinscription reprend les données de la saison précédente, à confirmer
- [x] Chaque consentement est tracé et retirable

## Revue de spec (2026-09-25)

Arbitrages rendus :

1. **Comptes** : le bureau crée les comptes (pas d'inscription libre sur le site) ; la famille se
   connecte avec son lien (005a) ou sa passkey (005c).
2. **Formalité médicale** : **attestation cochée en ligne** (« réponses toutes négatives au
   questionnaire de santé »), enregistrée comme « reçue le … » par ce responsable ; sinon « je
   fournirai un certificat médical » (reste à recevoir par le bureau). Jamais de donnée de santé.
3. **Nouvel enfant** : un responsable peut inscrire un enfant que le club ne connaît pas encore ;
   sa fiche est marquée « à vérifier » et le bureau la vérifie en validant le dossier.
4. **Fiche de l'adhérent** : la famille ne modifie que **l'adresse** (le reste : « signalez-le au
   bureau ») ; la fiche d'un enfant qu'elle vient d'ajouter reste modifiable jusqu'à la validation.

Choix de conception :

- **Quelle saison** : celle dont le bureau a ouvert les inscriptions (« Inscriptions ouvertes »,
  écran Saisons, spec 003) — en juin, la saison suivante, préparée par copie. Aucune saison
  ouverte : l'écran l'explique. Le bureau consulte et valide les dossiers **de cette saison**
  (choix de saison dans « Dossiers » et sur la fiche adhérent) ; tout le reste (trésorerie,
  garderie, accords) reste sur la saison courante.
- **Qui remplit** : un responsable légal (mère, père, tuteur) pour son enfant, l'adhérent majeur
  pour lui-même (comme les accords, spec 019).
- **Étapes sur mobile** : adhérent (adresse), activité (formule suggérée, passeport, montant
  estimé), paiement, santé, autorisations, engagements, récapitulatif → « Envoyer au club ».
  Brouillon gardé sur le téléphone jusqu'à l'envoi.
- **Reprise d'une saison sur l'autre** : formule (l'an dernier, ou d'après l'âge pour le judo),
  passeport, paiement, adresse **pré-remplis, à confirmer**. Les **consentements ne sont jamais
  pré-cochés** (un consentement doit être un acte positif) : la réponse de l'an dernier est
  rappelée, la famille répond de nouveau chaque saison.
- **Montant** : calculé et figé par le Worker ; « hors commune » d'après l'adresse, « réduction
  famille » si un frère ou une sœur (même responsable) a déjà un dossier de la saison.
- **Traçabilité** : chaque consentement daté et signé du responsable (`*_le`, `*_par`) ;
  engagements (règlement, assurance, information données personnelles) acceptés ensemble,
  datés ; envoi du dossier daté ; attestation de santé : date et auteur.
- **Modifiable** par la famille tant que le bureau n'a pas validé ; un dossier saisi par le bureau
  (papier) se consulte seulement. Consentements **retirables** à tout moment dans « Mes enfants »
  (accords de la saison courante **et** de la saison des inscriptions).
- **Données personnelles** : rien de nouveau hors traçabilité (dates, auteur) ; registre et page
  « Données personnelles » précisent le recueil en ligne.

## Notes

- Dépend de 003 (référentiels en base, saison 2027/2028) et 006 (complète). Cible : juin 2027.
