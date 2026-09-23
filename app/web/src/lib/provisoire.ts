import type { Environnement } from './api'

/**
 * Contenu provisoire (valeurs de remplacement en attendant les vraies informations du club) :
 * visible en local et en qualification, avec un badge « À compléter », mais JAMAIS en production.
 * Environnement inconnu (API pas encore répondu, ou injoignable) → masqué, par prudence.
 */
export function afficherProvisoire(environnement: Environnement | undefined): boolean {
  return environnement === 'local' || environnement === 'preview'
}
