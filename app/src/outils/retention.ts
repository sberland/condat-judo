// Rétention des sauvegardes chiffrées de la base (spec 007) — fonction pure, testée.
// Exécuté sous Node 24 directement (types effacés à l'exécution) : syntaxe TypeScript « effaçable »
// uniquement (pas d'enum, pas de namespace), imports avec extension .ts.

export type Sauvegarde = { nom: string; creeLe: string /* ISO 8601 */ }

const JOUR = 86_400_000

/**
 * Noms des sauvegardes à supprimer :
 * - `quotidienne-*` : on garde les 30 plus récentes, plus la plus ancienne de chaque mois sur les
 *   12 derniers mois (une par mois) ;
 * - `avant-migration-*` : gardées un an ;
 * - tout autre nom (sauvegarde manuelle…) : jamais supprimé.
 */
export function aSupprimer(sauvegardes: Sauvegarde[], aujourdhui: Date): string[] {
  const age = (s: Sauvegarde) => (aujourdhui.getTime() - new Date(s.creeLe).getTime()) / JOUR

  const quotidiennes = sauvegardes
    .filter((s) => s.nom.startsWith('quotidienne-'))
    .sort((a, b) => b.creeLe.localeCompare(a.creeLe))
  const gardees = new Set(quotidiennes.slice(0, 30).map((s) => s.nom))
  const premiereDuMois = new Map<string, Sauvegarde>()
  for (const s of quotidiennes) {
    if (age(s) > 366) continue
    const mois = s.creeLe.slice(0, 7)
    const deja = premiereDuMois.get(mois)
    if (!deja || s.creeLe < deja.creeLe) premiereDuMois.set(mois, s)
  }
  for (const s of premiereDuMois.values()) gardees.add(s.nom)

  return sauvegardes
    .filter((s) => {
      if (s.nom.startsWith('quotidienne-')) return !gardees.has(s.nom)
      if (s.nom.startsWith('avant-migration-')) return age(s) > 366
      return false
    })
    .map((s) => s.nom)
}
