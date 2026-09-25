# Expression du besoin — site du club Judo Condat

> Note d'origine du porteur de projet (2026-09-23), reprise sur le fond (forme et orthographe
> corrigées, structure en sections). C'est une **expression
> de besoin**, pas une spec : les specs `NNN` en sont tirées dans
> [`tasks/backlog.md`](../../tasks/backlog.md).

## Besoin d'origine

L'inscription pour les compétitions de judo est compliquée. L'espace dédié sur le site de la
fédération est complexe : les inscriptions sont donc centralisées par une personne du club, pour
simplifier le travail des parents.

Pour communiquer avec les parents (dates et lieux des compétitions) et savoir qui veut s'inscrire,
le club a mis en place un groupe WhatsApp. Mais un groupe WhatsApp, c'est le bazar, et c'est
compliqué à suivre.

L'idée est donc de monter un site web du club, sur lequel les parents pourront se connecter,
consulter les compétitions et inscrire leurs enfants. La ressaisie sur le site de la fédération
restera manuelle.

## Besoins greffés

Avec ce problème de base et la naissance du projet, d'autres besoins sont venus se greffer :

- **Mercredi (garderie)** : les parents peuvent inscrire leurs enfants pour qu'ils soient récupérés
  à la garderie par le club l'après-midi, pour le goûter et un cours de judo. C'est aujourd'hui géré
  aussi par WhatsApp, donc compliqué : quel parent de quel enfant répond, parents séparés, personnes
  qui changent de numéro, etc.
- **Communication** : toute la partie communication du club.
- **Paiement des licences** : éventuellement en ligne (mais les solutions de paiement prennent un
  pourcentage, et une association a des moyens très limités), ou a minima pour vérifier et valider
  le paiement effectué.

Le projet a vocation à gérer l'ensemble de ces besoins.

## Point clé : la connexion des parents

Les parents doivent pouvoir se connecter **simplement** : c'est vraiment la clé du succès. Ils le
feront le plus souvent depuis leur téléphone (dans 99 % des cas). Le canal WhatsApp est conservé
pour prévenir qu'il faut se connecter au site (par exemple pour une inscription à une compétition) :
il servira uniquement de « notification ».

## Administration

Une administration est nécessaire pour gérer les comptes : ajouter les enfants, les contacts des
parents, etc.

## Compétitions

Les parents inscrivent leur enfant à une compétition (simple).

## Garderie

- Les parents signalent que l'enfant doit être récupéré.
- La présence d'une photo pour bien reconnaître l'enfant serait un plus.
- Une checklist pour valider que l'enfant a bien été récupéré ? Pourquoi pas.

## Transverse

- Un parent peut avoir plusieurs enfants : les informations de chaque enfant doivent être
  facilement accessibles et modifiables.
- RGPD, données personnelles, cookies, consentement… : tout doit respecter les réglementations en
  vigueur.

## Complément (2026-09-24) — formulaire d'inscription

Le club utilise un **formulaire d'inscription papier** (saison 2026/2027). L'intégrer au site
permettrait d'avoir toutes les informations des adhérents et les contacts des parents. Ajouter les
éléments nécessaires et réglementaires ; signaler ce qui est obsolète pour arbitrage.

Structure du formulaire papier (relevée sur un exemplaire rempli — **aucune donnée nominative
reprise ici**) :

- **Identité** (« en majuscules ») : nom, prénom, date de naissance, sexe (M / F), ceinture,
  e-mail, adresse, code postal, ville, téléphone du responsable légal, WhatsApp oui / non.
- **Tarifs judo** :

  | | Micro-poussins / Mini-poussins (nés 2021-2022 / 2019-2020) | Poussins à juniors (nés 2017-2018 … 2007-2008-2009) | Judo adulte |
  | --- | --- | --- | --- |
  | Participation à l'activité | 82 € | 101 € | 75 € |
  | Licence FFJDA | 46 € | 46 € | 46 € |
  | Sous-total | 128 € | 147 € | 121 € |

- **Tarifs taïso / yoga** :

  | | Taïso | Yoga lundi **ou** jeudi | Yoga lundi **et** jeudi |
  | --- | --- | --- | --- |
  | Participation à l'activité | 75,20 € | 59,20 € | 119,20 € |
  | Licence FFJDA | 43,80 € | 43,80 € | 43,80 € |
  | Sous-total | 119 € | 103 € | 163 € |

- **Suppléments et réductions** : passeport +8 € (« obligatoire à partir de poussin », judo
  seulement), résident hors commune +2 €, réduction famille −8 € sur la 2ᵉ licence (nom du 1ᵉʳ
  licencié à indiquer).
- **Paiement** : chèque, espèces, CB, autre (chèques vacances…) ; **paiement en 3 fois** possible
  (1ᵉʳ versement = licence + une part de l'activité, puis deux versements — ex. micro et mini
  poussins : 46 € + 28 €, puis 27 €, puis 27 €).
- **Pièce à fournir** : certificat médical pour la pratique du judo, y compris en compétition.
- **Droit à l'image** : mention indiquant que l'adhérent (ou son représentant légal) accepte, par
  son inscription, l'utilisation de son image à des fins d'information et de communication, avec
  droit de retrait.

Analyse et points à arbitrer : spec [`010-CHT-adhesion.md`](../../tasks/done/010-CHT-adhesion.md).

## Sources d'inspiration

- <https://judo-condat.jimdofree.com/actualite-club/> — a priori une première tentative de site
- Fiche sur IntraMuros (application de la mairie) : <https://www.intramuros.org/fiche/acteur/65869>
- Page Facebook (semble la plus active) : <https://www.facebook.com/p/Judo-Condat-100010470662307/>

## Éléments de contexte recueillis

- Petit club de campagne ; une vingtaine d'enfants de 7 à 15 ans. Effectif total non connu
  précisément.
