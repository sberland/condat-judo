# Instructions du projet

## Documentation à lire

Avant toute modification :

1. Lire `CLAUDE.md`.
2. Lire les documents d’architecture et de conventions référencés dans celui-ci.
3. Consulter uniquement les autres fichiers Markdown utiles à la tâche demandée.

## Règles de travail

- Respecter l’architecture et les conventions existantes.
- Ne pas modifier un comportement non concerné par la demande.
- Ne pas ajouter de dépendance sans justification.
- Avant de terminer, exécuter les tests, le lint et le build appropriés.
- Présenter un résumé des changements et des vérifications effectuées.

## Questions et décisions utilisateur

Lorsqu’une information, une confirmation ou une décision de l’utilisateur est nécessaire, utiliser en priorité l’outil de question interactive prévu par Codex lorsqu’il est disponible dans le mode actuel.

Ne pas demander à l’utilisateur de répondre librement dans le texte avec une formulation vague comme :

- « Souhaites-tu… ? »
- « Tu peux répondre par… »
- « Dis-moi si… »
- « Réponds “validé” pour continuer »
- « Quelle option préfères-tu ? »

### Lorsque la question interactive est disponible

1. Présenter la décision avec une question interactive.
2. Proposer 2 ou 3 choix mutuellement exclusifs.
3. Placer le choix recommandé en premier.
4. Ajouter « (Recommandé) » au libellé du choix recommandé.
5. Expliquer brièvement l’impact de chaque choix.
6. Permettre une réponse personnalisée lorsque les choix proposés ne conviennent pas.
7. Regrouper jusqu’à 3 questions dans un même questionnaire lorsqu’elles concernent la même étape.
8. Attendre les réponses avant de poursuivre les actions qui dépendent de ces décisions.

### Lorsque la question interactive n’est pas disponible

Ne jamais demander à l’utilisateur de changer de mode uniquement pour afficher un questionnaire interactif.

Présenter directement la décision dans la conversation sous la forme suivante :

1. Proposer 2 ou 3 choix numérotés et mutuellement exclusifs.
2. Placer le choix recommandé en premier.
3. Ajouter « (Recommandé) » au libellé du choix recommandé.
4. Expliquer brièvement l’impact de chaque choix.
5. Permettre à l’utilisateur de répondre uniquement par le numéro du choix.
6. Permettre également une réponse personnalisée si aucun choix ne convient.
7. Regrouper les décisions qui concernent la même étape.
8. Attendre la réponse uniquement lorsque la décision est réellement nécessaire pour continuer.

Une question présentée en texte doit donc rester structurée. Ne pas utiliser une simple question ouverte ou une liste vague « Oui / Non ».

### Continuité du workflow

- Ne jamais interrompre un workflow uniquement parce que le mode Plan n’est plus actif.
- Ne jamais demander de repasser en mode Plan lorsqu’une implémentation est déjà en cours.
- Le mode Plan est principalement utilisé pour le cadrage initial, les choix structurants et la validation du plan.
- Après validation du plan, poursuivre normalement l’implémentation dans le mode d’exécution.
- Si une décision imprévue apparaît pendant l’exécution, la présenter directement dans la conversation lorsque l’outil interactif n’est pas disponible.
- Ne pas recommencer intégralement la planification pour une décision locale apparue pendant l’exécution.

### Décisions nécessitant une validation

Ces règles concernent notamment :

- les validations d’étapes ;
- les choix fonctionnels ou techniques ;
- les stratégies d’implémentation ;
- les niveaux de version ;
- les décisions de déploiement ;
- les confirmations avant une action importante ;
- toute information manquante qui bloque ou modifie significativement la suite du travail ;
- les décisions relatives à une branche, un commit, une pull request, un merge, une publication, une livraison ou un déploiement lorsque plusieurs suites sont possibles.

Toujours attendre une validation explicite avant une action sensible, irréversible ou ayant un impact externe, notamment :

- merger une branche ou une pull request ;
- publier une version ;
- effectuer une livraison ou un déploiement ;
- appliquer une migration en production ;
- supprimer des données ;
- modifier une ressource externe ;
- déclencher une action difficilement réversible.

Pour une décision mineure, réversible et clairement couverte par les instructions du projet, appliquer le choix recommandé et poursuivre le travail en indiquant brièvement l’hypothèse retenue.

### Autorisations système

Les demandes d’autorisation système ou d’exécution doivent continuer à utiliser le mécanisme d’approbation natif de Codex.

Une question fonctionnelle ou une décision de workflow ne doit pas être confondue avec une demande d’autorisation système.