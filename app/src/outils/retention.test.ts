import { describe, expect, it } from 'vitest'
import { aSupprimer, type Sauvegarde } from './retention.ts'

const AUJOURDHUI = new Date('2027-09-24T03:00:00Z')

/** Une sauvegarde quotidienne par jour, du plus récent au plus ancien, sur `jours` jours. */
function quotidiennes(jours: number): Sauvegarde[] {
  return Array.from({ length: jours }, (_, i) => {
    const d = new Date(AUJOURDHUI.getTime() - i * 86_400_000)
    const jour = d.toISOString().slice(0, 10)
    return { nom: `quotidienne-${jour}`, creeLe: `${jour}T02:30:00Z` }
  })
}

describe('rétention des sauvegardes', () => {
  it('garde tout tant qu’il y a 30 sauvegardes ou moins', () => {
    expect(aSupprimer(quotidiennes(30), AUJOURDHUI)).toEqual([])
  })

  it('au-delà des 30 dernières, garde la première de chaque mois sur un an, et rien de plus vieux', () => {
    const toutes = quotidiennes(500)
    const supprimees = new Set(aSupprimer(toutes, AUJOURDHUI))
    const recentes = new Set(quotidiennes(30).map((s) => s.nom))
    const anciennesGardees = toutes.map((s) => s.nom).filter((n) => !supprimees.has(n) && !recentes.has(n))
    // Mois de sept. 2026 entamé (la plus ancienne de moins d'un an), puis le 1er d'oct. 2026 à août 2027
    // (le 1er sept. 2027 fait déjà partie des 30 dernières).
    const attendues = ['2026-09-24', ...Array.from({ length: 11 }, (_, i) => new Date(Date.UTC(2026, 9 + i, 1)).toISOString().slice(0, 10))]
    expect(anciennesGardees.sort()).toEqual(attendues.map((j) => `quotidienne-${j}`).sort())
    expect([...recentes].every((n) => !supprimees.has(n))).toBe(true)
  })

  it('garde les sauvegardes d’avant migration un an', () => {
    const s: Sauvegarde[] = [
      { nom: 'avant-migration-v0.7.0', creeLe: '2027-03-01T10:00:00Z' },
      { nom: 'avant-migration-v0.4.0', creeLe: '2026-09-01T10:00:00Z' },
    ]
    expect(aSupprimer(s, AUJOURDHUI)).toEqual(['avant-migration-v0.4.0'])
  })

  it('ne supprime jamais une sauvegarde au nom inconnu (manuelle)', () => {
    expect(aSupprimer([{ nom: 'avant-restauration-test', creeLe: '2020-01-01T00:00:00Z' }], AUJOURDHUI)).toEqual([])
  })
})
