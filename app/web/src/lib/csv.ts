// Export CSV « à la française » (séparateur ;) — ouvert tel quel par Excel ou LibreOffice.
// Généré dans le navigateur : rien n'est stocké côté serveur.

/** Tableau (première ligne = en-têtes) → CSV ; guillemets doublés si besoin, fins de ligne CRLF. */
export function versCsv(lignes: string[][]): string {
  const cellule = (v: string) => (/[;"\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v)
  return lignes.map((cols) => cols.map(cellule).join(';')).join('\r\n')
}

/** Tableau → texte à coller dans un tableur (tabulations, espaces normalisés). */
export function versTexte(lignes: string[][]): string {
  return lignes.map((cols) => cols.map((v) => v.replace(/\s+/g, ' ')).join('\t')).join('\n')
}

/** « Tournoi de l’Épée — Limoges » → « tournoi-de-l-epee-limoges » (noms de fichiers). */
export const slug = (texte: string) =>
  texte
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

/** Fait télécharger un fichier généré dans le navigateur. */
export function telecharger(nomFichier: string, contenu: BlobPart[], type: string): void {
  const url = URL.createObjectURL(new Blob(contenu, { type }))
  const a = document.createElement('a')
  a.href = url
  a.download = nomFichier
  a.click()
  URL.revokeObjectURL(url)
}

/** Téléchargement CSV (BOM pour que les accents s'affichent sous Excel). */
export const telechargerCsv = (nomFichier: string, lignes: string[][]) =>
  telecharger(nomFichier, [String.fromCharCode(0xfeff), versCsv(lignes)], 'text/csv;charset=utf-8')

/** Téléchargement JSON lisible (indenté). */
export const telechargerJson = (nomFichier: string, donnees: unknown) =>
  telecharger(nomFichier, [JSON.stringify(donnees, null, 2)], 'application/json;charset=utf-8')
