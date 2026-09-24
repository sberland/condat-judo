import { describe, expect, it } from 'vitest'
import { RUBRIQUES_AIDE, rubriquesPour } from './aide'

const ids = (roles: Parameters<typeof rubriquesPour>[0]) => rubriquesPour(roles).map((r) => r.id)

describe('aide intégrée — filtrage par profil', () => {
  it('un parent (sans rôle) ne voit que l’aide famille', () => {
    expect(rubriquesPour([]).every((r) => r.profil === 'famille')).toBe(true)
    expect(ids([])).toEqual(['connexion', 'mes-enfants', 'donnees'])
  })

  it('le bureau voit l’aide famille et bureau, pas l’administration', () => {
    expect(ids(['bureau'])).toContain('liens-connexion')
    expect(ids(['bureau'])).toContain('connexion')
    expect(ids(['bureau'])).not.toContain('roles')
  })

  it('un administrateur voit toutes les rubriques', () => {
    expect(ids(['admin'])).toEqual(RUBRIQUES_AIDE.map((r) => r.id))
  })

  it('un rôle sans écran (trésorier, encadrant, contenu) voit l’aide famille', () => {
    for (const role of ['tresorier', 'encadrant', 'contenu'] as const) expect(ids([role])).toEqual(ids([]))
  })

  it('rubriques et questions : identifiants uniques, contenu non vide', () => {
    expect(new Set(RUBRIQUES_AIDE.map((r) => r.id)).size).toBe(RUBRIQUES_AIDE.length)
    for (const r of RUBRIQUES_AIDE) {
      expect(r.questions.length, r.id).toBeGreaterThan(0)
      expect(new Set(r.questions.map((q) => q.q)).size, r.id).toBe(r.questions.length)
      for (const q of r.questions) expect(q.r.length, `${r.id} : ${q.q}`).toBeGreaterThan(0)
    }
  })
})
