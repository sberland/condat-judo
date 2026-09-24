# 006 — Conformité RGPD : socle avant les données des familles

## Pourquoi

Le site va traiter des données de familles, **dont des mineurs** : identité, coordonnées, photos
(garderie), informations liées à la santé (formalités médicales). Le club est **responsable du
traitement** : il doit informer, recueillir les consentements nécessaires, limiter les accès et
les durées. À livrer **avant** l'ouverture des espaces privés aux familles.

## Quoi

- **Registre des traitements** (document interne, dans `workspace/docs/`) : adhésions,
  compétitions, garderie, paiements, communication — finalité, base légale, données, destinataires
  (dont France Judo pour les licences), durée de conservation, mesures de sécurité.
- **Information des personnes** (art. 13 RGPD) : page « Données personnelles » + mention courte à
  chaque formulaire de collecte (qui, pourquoi, combien de temps, droits, contact).
- **Consentements** explicites, séparés, **opt-in**, retirables à tout moment, et datés :
  droit à l'image (site, réseaux sociaux, presse), photo d'identification pour la garderie,
  ajout au groupe WhatsApp du club. Pour un mineur : donnés par un responsable légal.
- **Durées de conservation** et purge : ex. adhérent inactif depuis N saisons → anonymisation ;
  pièces et attestations → fin de saison + délai.
- **Droits des personnes** : accès / export (JSON ou PDF), rectification (espace famille),
  suppression (demande traitée par le bureau).
- **Sécurité** : accès aux données au strict nécessaire par rôle (004), journal des accès
  sensibles (photos, contacts), aucune donnée personnelle dans le dépôt, qualif anonymisée (008).
- **Données de santé** : ne rien stocker d'autre que « attestation reçue le … » / « certificat
  reçu le … » (jamais le questionnaire ni le certificat eux-mêmes).
- **Cookies** : uniquement le cookie de session (strictement nécessaire) → pas de bandeau.

## Critères d'acceptation

- [ ] Chaque formulaire de collecte affiche sa mention d'information
- [ ] Chaque consentement est tracé (qui, quand, pour quel enfant) et retirable
- [ ] Un responsable peut télécharger les données le concernant, lui et ses enfants
- [ ] Le registre des traitements est rédigé et validé par le bureau
- [ ] La purge des données expirées est automatisée (ou procédure documentée)

## Hors périmètre

- Formation du bureau, désignation éventuelle d'un référent RGPD (organisation du club)

## Notes

- Le règlement intérieur et la mention « droit à l'image » du formulaire papier sont à mettre en
  conformité (cf. arbitrages de la spec 010).
- Droits requis : `admin` pour les exports globaux et la purge ; chaque responsable pour ses
  propres données.
