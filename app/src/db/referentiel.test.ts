// Migration 0008 (spec 003) : la saison 2026/2027 insérée en base est exactement le référentiel
// qui était dans le code (content/referentiel-initial.ts) — aucun tarif ni catégorie ne change.
import { readdirSync, readFileSync } from 'node:fs'
import { DatabaseSync } from 'node:sqlite'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { validerReferentiel } from '../../web/src/content/referentiel'
import { REFERENTIEL_2026_2027 } from '../../web/src/content/referentiel-initial'

const dossier = fileURLToPath(new URL('./migrations/', import.meta.url))

describe('migration des référentiels', () => {
  const db = new DatabaseSync(':memory:')
  for (const f of readdirSync(dossier).filter((f) => f.endsWith('.sql')).sort()) db.exec(readFileSync(dossier + f, 'utf8'))
  const saison = db.prepare('SELECT id, libelle, courante, referentiel FROM saisons').get() as Record<string, unknown>

  it('insère 2026/2027 comme saison courante', () => {
    expect(saison).toMatchObject({ id: '2026-2027', libelle: '2026/2027', courante: 1 })
  })

  it('avec le référentiel du code, valide', () => {
    const r = JSON.parse(String(saison.referentiel))
    expect(r).toEqual(REFERENTIEL_2026_2027)
    expect(validerReferentiel(r).ok).toBe(true)
  })

  it('une seule saison courante', () => {
    db.exec("INSERT INTO saisons (id, libelle, debut, fin, referentiel) VALUES ('2027-2028', '2027/2028', '2027-09-01', '2028-08-31', '{}')")
    expect(() => db.exec("UPDATE saisons SET courante = 1 WHERE id = '2027-2028'")).toThrow()
  })
})
