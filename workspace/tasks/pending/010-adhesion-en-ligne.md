# 010 — Adhésion en ligne (dossier d'inscription)

## Pourquoi

L'inscription au club se fait sur un formulaire papier (saison 2026/2027) : ressaisies, écriture
illisible, informations incomplètes (un seul téléphone de responsable), mentions obsolètes. Le
remplacer par un dossier en ligne donne au bureau **toutes les informations des adhérents et des
contacts parents**, à jour, et prépare compétitions, garderie et paiements.

## Quoi

Dossier d'inscription en ligne, rempli par un responsable (ou l'adhérent majeur), **par adhérent**
et **par saison**, pré-rempli d'une saison sur l'autre :

1. **Adhérent** : nom, prénom, date de naissance (→ catégorie calculée, 003), sexe, grade
   (ceinture), n° de licence FFJudo si renouvellement, adresse, code postal, ville.
2. **Responsables légaux** (mineur) : **un ou deux** responsables, chacun avec nom, prénom,
   lien, téléphone, e-mail (004) ; **contact d'urgence** si différent.
3. **Activité** : discipline(s) et formule (judo par tranche d'âge, taïso, yoga lundi / jeudi / les
   deux), cours (003).
4. **Montant calculé** automatiquement : participation + licence, + passeport, + hors commune,
   − réduction famille (appliquée automatiquement à la 2ᵉ licence d'un même foyer) ; mode de
   paiement et paiement en 3 fois (échéancier affiché) → suivi en 011.
5. **Formalités médicales** (règlement intérieur à jour) : mineur → attestation du questionnaire
   de santé signée par le responsable ; majeur → certificat (1ʳᵉ licence) ou attestation QS-SPORT ;
   on enregistre seulement « attestation / certificat reçu le … », jamais de donnée de santé.
6. **Autorisations** : soins d'urgence (hospitalisation / intervention en cas d'urgence) ;
   personnes autorisées à récupérer l'enfant (garderie, fin de cours) ; ajout au groupe WhatsApp.
7. **Consentements** explicites (006) : droit à l'image (oui / non, par support), photo
   d'identification pour la garderie (oui / non).
8. **Engagements** : acceptation du règlement intérieur ; information sur l'assurance (garanties
   de la licence et intérêt d'une assurance complémentaire — obligation d'information, Code du
   sport art. L321-4) ; mention d'information RGPD.
9. **Validation par le bureau** : dossier « à compléter / complet / validé » ; liste des dossiers
   incomplets ; export des informations nécessaires à la prise de licence.

## Critères d'acceptation

- [ ] Un parent remplit le dossier de deux enfants depuis son téléphone, sans ressaisir ses coordonnées
- [ ] Le montant affiché correspond à la grille de la saison (réduction famille comprise)
- [ ] Une réinscription la saison suivante reprend les données, à confirmer
- [ ] Le bureau voit d'un coup d'œil les dossiers incomplets et ce qui manque
- [ ] Aucune donnée de santé n'est stockée ; chaque consentement est tracé et retirable

## Hors périmètre

- Paiement en ligne (proposition HelloAsso au backlog) ; suivi des encaissements (011)
- Prise de licence sur l'extranet fédéral (reste manuelle ou par l'adhérent — à arbitrer)

## Notes — analyse du formulaire papier : points à arbitrer

| # | Élément du formulaire | Constat | Proposition |
| --- | --- | --- | --- |
| A1 | « Pièce à fournir : certificat médical pour la pratique du judo, y compris en compétition » | **Obsolète pour les mineurs** depuis le décret n° 2021-564 : questionnaire de santé + attestation des parents ; majeurs : certificat à la 1ʳᵉ licence puis QS-SPORT | Remplacer par les formalités à jour (étape 5), comme le règlement intérieur du site |
| A2 | « Passeport +8 € (obligatoire à partir de poussin) » | Textes officiels 2026/2027 : en compétition, identité par le **passeport sportif ou tout autre justificatif** | Passeport **proposé** (recommandé pour les compétiteurs), plus « obligatoire » |
| A3 | Licence FFJDA **46 €** (judo) mais **43,80 €** (taïso / yoga) | Deux montants pour la même licence : incohérence ou tarif différent ? | Vérifier le tarif fédéral 2026/2027 avec le club |
| A4 | Tranches d'années (micro / mini-poussins 2021-2022 / 2019-2020 ; poussins à juniors 2017-2018 … 2007-2008-2009) | À recaler chaque saison | Catégorie **calculée** depuis la date de naissance (003), grille vérifiée avec les textes officiels |
| A5 | Droit à l'image : consentement **implicite** « par son inscription », avec droit de retrait | Non conforme : le consentement doit être **explicite** (case oui / non), séparé, par support, donné par un responsable pour un mineur | Consentement opt-in (étape 7, spec 006) |
| A6 | Aucune mention d'information sur les données personnelles | Obligatoire au moment de la collecte (art. 13 RGPD) | Mention courte + page « Données personnelles » (006) |
| A7 | Un seul « Tel responsable légal », un seul e-mail | Insuffisant (parents séparés, urgences) | Deux responsables + contact d'urgence (étape 2) |
| A8 | Absents : autorisation de soins d'urgence, personnes autorisées à récupérer l'enfant, acceptation du règlement, information assurance | Usuels / nécessaires (garderie), information assurance obligatoire | Ajoutés (étapes 6 et 8) |
| A9 | « WhatsApp oui / non » | Le numéro est partagé avec les membres du groupe et Meta : c'est un consentement | Consentement explicite, retirable (006) |
| A10 | Yoga (lundi / jeudi) | Discipline absente du site | Ajout (spec 002) — texte à fournir par le club |
| A11 | Paiement « CB » | Par quel moyen (terminal, lien de paiement) ? | À préciser ; paiement en ligne = proposition HelloAsso |
| A12 | Allergies / informations médicales pour le goûter de la garderie | Non demandé ; données de santé (art. 9 RGPD) | À arbitrer : ne rien collecter (consigne orale) ou champ facultatif avec consentement explicite, visible des seuls encadrants |
| A13 | « Écrire en majuscules » | Inutile en ligne | Normalisation automatique de la casse |

- **Dépend de** : 003, 004, 005, 006. Cible : **ouverture pour les inscriptions de la saison
  2027/2028** (juin-septembre 2027). Pour la saison en cours, le bureau saisit les adhérents
  depuis les dossiers papier (004).
- Droits requis : responsable lié (ses enfants), adhérent majeur (lui-même), `bureau` (tous les
  dossiers, validation), `tresorier` (montants, 011).
- Données personnelles : identité et coordonnées de mineurs et de leurs responsables, photos
  (consentement), autorisations — registre (006).
