// Migration 0012 (spec 014) : le contenu inséré en base est exactement celui qui était dans le code
// (content/contenu-initial.ts), et il passe la validation du Worker.
import { readdirSync, readFileSync } from 'node:fs'
import { DatabaseSync } from 'node:sqlite'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { CLES_CONTENU, validerContenu, type CleContenu } from '../../web/src/content/contenu'
import { CONTENU_INITIAL, STATUTS_INITIAUX } from '../../web/src/content/contenu-initial'

const dossier = fileURLToPath(new URL('./migrations/', import.meta.url))

describe('migration du contenu du site', () => {
  const db = new DatabaseSync(':memory:')
  for (const f of readdirSync(dossier).filter((f) => f.endsWith('.sql')).sort()) db.exec(readFileSync(dossier + f, 'utf8'))
  const lignes = db.prepare('SELECT cle, valeur, statut FROM contenus ORDER BY cle').all() as { cle: CleContenu; valeur: string; statut: string }[]

  it('un document par type de contenu', () => {
    expect(lignes.map((l) => l.cle).sort()).toEqual([...CLES_CONTENU].sort())
  })

  it('identique au contenu du code, avec son statut, et valide', () => {
    for (const l of lignes) {
      const valeur = JSON.parse(l.valeur)
      expect(valeur, l.cle).toEqual(CONTENU_INITIAL[l.cle])
      expect(l.statut, l.cle).toBe(STATUTS_INITIAUX[l.cle])
      expect(validerContenu(l.cle, valeur), l.cle).toEqual({ ok: true, valeur })
    }
  })

  it('première version de chaque contenu dans l’historique', () => {
    expect(db.prepare('SELECT count(*) AS n FROM contenus_versions').get()).toEqual({ n: CLES_CONTENU.length })
  })
})
