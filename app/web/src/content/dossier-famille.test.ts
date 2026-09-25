import { describe, expect, it } from 'vitest'
import { formaliteDeLaFamille, formuleProposee } from './adhesion'
import { copierReferentiel } from './referentiel'
import { REFERENTIEL_2026_2027 } from './referentiel-initial'

// Grille de la saison suivante, préparée par copie (années décalées d'un an) : 2027/2028.
const T = copierReferentiel(REFERENTIEL_2026_2027).tarifs

describe('formule proposée à la réinscription (spec 010b)', () => {
  it('judo : d’après l’âge, la tranche changeant avec les années', () => {
    // Né en 2019 : « micro-mini » en 2026/2027 (2019-2022), « poussins-juniors » en 2027/2028 (2008-2019 → 2019 couvert ?).
    const attendue = T.groupes.flatMap((g) => g.formules).find((f) => f.judo && f.annees && f.annees.de <= 2019 && 2019 <= f.annees.a)?.id
    expect(formuleProposee(T, 2019, 'judo-micro-mini')).toBe(attendue)
  })

  it('autre formule : celle de l’an dernier si elle existe encore', () => {
    expect(formuleProposee(T, 1985, 'yoga-2')).toBe('yoga-2')
    expect(formuleProposee(T, 1985, 'taiso')).toBe('taiso')
  })

  it('formule disparue de la grille : rien de proposé ; nouvel adhérent : d’après l’âge', () => {
    expect(formuleProposee(T, 1985, 'aquagym')).toBe('')
    expect(formuleProposee(T, 2021, null)).toBe('judo-micro-mini')
  })
})

describe('formalité médicale déclarée par la famille', () => {
  it('attestation : questionnaire mineur ou QS-SPORT ; sinon certificat à fournir', () => {
    expect(formaliteDeLaFamille('attestation', true)).toBe('attestation_qs_mineur')
    expect(formaliteDeLaFamille('attestation', false)).toBe('attestation_qs_sport')
    expect(formaliteDeLaFamille('certificat', true)).toBe('certificat')
  })
})
