// Familles (spec 011) — il n'y a pas de table « foyer » : deux adhérents sont de la même famille
// s'ils partagent un responsable (ou si l'un est le compte de l'autre : parent adhérent). Calcul à
// la volée, donc toujours à jour quand le bureau modifie les liens.

/** Arête adhérent ↔ compte : responsable légal (liens) ou compte de l'adhérent majeur lui-même. */
export type Arete = { adherent_id: number; user_id: number };

/** Regroupe les adhérents en familles (composantes connexes), chacune triée, dans l'ordre du premier adhérent. */
export function regrouperFamilles(adherents: number[], aretes: Arete[]): number[][] {
  const parent = new Map<number, number>(adherents.map((a) => [a, a]));
  const racine = (a: number): number => {
    let r = a;
    while (parent.get(r) !== r) r = parent.get(r) as number;
    parent.set(a, r);
    return r;
  };
  const unir = (a: number, b: number) => {
    const ra = racine(a);
    const rb = racine(b);
    if (ra !== rb) parent.set(Math.max(ra, rb), Math.min(ra, rb));
  };

  const parCompte = new Map<number, number>();
  for (const { adherent_id, user_id } of aretes) {
    if (!parent.has(adherent_id)) continue;
    const deja = parCompte.get(user_id);
    if (deja === undefined) parCompte.set(user_id, adherent_id);
    else unir(deja, adherent_id);
  }

  const groupes = new Map<number, number[]>();
  for (const a of [...adherents].sort((x, y) => x - y)) {
    const r = racine(a);
    groupes.set(r, [...(groupes.get(r) ?? []), a]);
  }
  return [...groupes.values()];
}
