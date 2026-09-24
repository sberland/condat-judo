import { describe, expect, it } from 'vitest';
import { regrouperFamilles } from './familles';

describe('regroupement des adhérents en familles', () => {
  it('frère et sœur liés au même parent : une famille', () => {
    expect(regrouperFamilles([1, 2, 3], [{ adherent_id: 1, user_id: 10 }, { adherent_id: 2, user_id: 10 }, { adherent_id: 3, user_id: 11 }])).toEqual([[1, 2], [3]]);
  });

  it('parents séparés : les enfants de l’un et de l’autre se rejoignent par l’enfant commun', () => {
    // 1 : enfant du couple (10 et 11) ; 2 : enfant de 10 seul ; 3 : enfant de 11 seul.
    const aretes = [
      { adherent_id: 1, user_id: 10 },
      { adherent_id: 1, user_id: 11 },
      { adherent_id: 2, user_id: 10 },
      { adherent_id: 3, user_id: 11 },
    ];
    expect(regrouperFamilles([1, 2, 3], aretes)).toEqual([[1, 2, 3]]);
  });

  it('parent lui-même adhérent : il rejoint la famille de ses enfants', () => {
    // 5 = adhérent majeur dont le compte est 10, parent de 1.
    expect(regrouperFamilles([1, 5], [{ adherent_id: 1, user_id: 10 }, { adherent_id: 5, user_id: 10 }])).toEqual([[1, 5]]);
  });

  it('adhérent sans responsable : seul dans sa famille ; arêtes hors liste ignorées', () => {
    expect(regrouperFamilles([4, 2], [{ adherent_id: 9, user_id: 10 }])).toEqual([[2], [4]]);
  });
});
