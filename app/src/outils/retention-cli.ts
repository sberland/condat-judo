// Rétention des sauvegardes (spec 007) — lit sur l'entrée standard la liste des Releases du dépôt
// de sauvegarde (`gh release list --json tagName,createdAt`) et écrit, une par ligne, les
// sauvegardes à supprimer. Usage (Node 24) : … | node app/src/outils/retention-cli.ts
import { aSupprimer } from './retention.ts'

let entree = ''
for await (const morceau of process.stdin) entree += morceau
// BOM éventuel (tube PowerShell 5.1) ignoré.
const releases = JSON.parse(entree.replace(/^﻿/, '') || '[]') as { tagName: string; createdAt: string }[]
for (const nom of aSupprimer(
  releases.map((r) => ({ nom: r.tagName, creeLe: r.createdAt })),
  new Date(),
))
  console.log(nom)
