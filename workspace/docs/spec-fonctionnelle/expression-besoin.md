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

## Sources d'inspiration

- <https://judo-condat.jimdofree.com/actualite-club/> — a priori une première tentative de site
- Fiche sur IntraMuros (application de la mairie) : <https://www.intramuros.org/fiche/acteur/65869>
- Page Facebook (semble la plus active) : <https://www.facebook.com/p/Judo-Condat-100010470662307/>

## Éléments de contexte recueillis

- Petit club de campagne ; une vingtaine d'enfants de 7 à 15 ans. Effectif total non connu
  précisément.
