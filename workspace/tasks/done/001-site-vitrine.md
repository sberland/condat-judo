# 001 — Site vitrine public du club

## Pourquoi

Le club n'a aujourd'hui qu'un site Jimdo daté (en partie vide) et une page Facebook. Première
brique du nouveau site : une vitrine publique, moderne et lisible sur téléphone, qui présente le
club et remplace le site Jimdo — avant les fonctionnalités réservées aux familles.

## Quoi

Site public (aucune connexion), **mobile d'abord**, au style des sites grand public : en-tête
fixe avec menu burger sur mobile, grandes zones cliquables, sections aérées, pied de page complet.
Identité visuelle reprise du **logo du club** (noir, rouge, blanc).

Pages :

| Route | Contenu (repris du site Jimdo, textes produits par le club) |
| --- | --- |
| `/` | Accueil : bandeau d'accroche (club de judo, jujitsu et taïso à Condat-sur-Vienne, éveil judo dès 4 ans), disciplines en cartes, extrait du code moral, infos pratiques (dojo, saison), appel à contact |
| `/disciplines` | Judo (dont éveil judo 4-5 ans), jujitsu, taïso — textes du club |
| `/club` | Le club : professeur, bureau, dojo (adresse + itinéraire), code moral complet (France Judo), partenaires, affiliation France Judo, liens utiles |
| `/reglement` | Règlement intérieur complet (sections dépliables) |
| `/horaires-tarifs` | Horaires des cours et tarifs (provisoires) |
| `/contact` | E-mail et téléphone (provisoires), adresse du dojo + itinéraire, page Facebook, prise de licence France Judo |
| `/mentions-legales` | Éditeur, hébergeur (Cloudflare), données personnelles (aucun cookie, aucun traceur) |

Contenu **non repris** (règle : une section sans donnée n'est pas créée) : inscriptions,
groupes par âge (images seules), yoga et self-défense (titres sans texte),
actualités (renvoi vers Facebook). Aucune photo d'enfant. Liens morts non repris (Comité 87,
Ligue du Limousin).

Technique :

- Front React existant (TanStack Router) : une route par page, titre + description par page.
- Contenu en données TypeScript (`web/src/content/`) — pas de base : rien de dynamique ici.
- Carte : **lien** d'itinéraire (OpenStreetMap / Google Maps), **pas d'intégration** (une carte
  intégrée déposerait des cookies tiers → bandeau de consentement).
- Police auto-hébergée (paquet npm), aucune ressource tierce chargée par le site.
- Logos : club (`/logo-judo-condat.png`, repris du site Jimdo), France Judo blanc (affiliation).

## Critères d'acceptation

- [ ] Les 7 pages s'affichent et se naviguent sans rechargement, liens directs compris
- [ ] Utilisable à 360 px de large (menu burger, pas de défilement horizontal), confortable sur desktop
- [ ] Textes du club repris fidèlement (orthographe corrigée seulement)
- [ ] Aucune ressource tierce chargée (police, carte, images) ; aucun cookie
- [ ] Bandeau « pas la production » toujours visible en preview / local
- [ ] Contenus provisoires visibles (badge « À compléter ») en local / preview, invisibles en production
- [ ] Build, typecheck, tests OK ; prod publique après tag

## Hors périmètre

- Espace membres, connexion, formulaires (contact, inscription) — specs dédiées
- Horaires / tarifs tant que le club ne les a pas fournis
- Nom de domaine personnalisé

## Notes — décisions du porteur de projet (2026-09-23)

| Point | Décision |
| --- | --- |
| Contact | E-mail et téléphone **provisoires** (valeurs bidon), complétés plus tard avec le club. L'e-mail personnel du président n'est pas publié |
| Noms (professeur, bureau) | Publiés (déjà publics sur l'ancien site) |
| Mentions légales | Identité officielle trouvée dans l'annuaire des entreprises : « Condat-sur-Vienne Judo », association loi 1901, RNA W872010702, SIREN 812 679 124, siège 13 rue des Peupliers, 87920 Condat-sur-Vienne ; directeur de la publication : le président |
| Logo France Judo | Affiché (« club affilié ») — usage à valider avec le club et la fédération |
| Horaires, tarifs | **Provisoires** (valeurs bidon), page dédiée `/horaires-tarifs` |
| Partenaires | **Provisoires** : Sof't Café (à confirmer) + un emplacement à compléter |
| Règlement | Mis à jour selon la réglementation France Judo en vigueur : questionnaire de santé (mineurs) / QS-SPORT (majeurs) au lieu du certificat systématique (décret n° 2021-564), identité en compétition par passeport sportif ou tout justificatif (textes officiels 2026/2027) — sources affichées sur la page |

**Contenus provisoires** (`provisoire: true` dans `web/src/content/club.ts`) : affichés avec un badge
« À compléter » en local et en qualification, **jamais en production** (`lib/provisoire.ts`, testé) ;
en production, l'entrée de menu « Horaires & tarifs » est masquée et la page affiche un renvoi vers
le contact. Pour publier une vraie valeur : la renseigner et passer `provisoire` à `false`.

## Références

- Site actuel : <https://judo-condat.jimdofree.com/>
- Code moral : <https://www.ffjudo.com/le-code-moral-du-judo>
- Expression du besoin : [`expression-besoin.md`](../../docs/spec-fonctionnelle/expression-besoin.md)
