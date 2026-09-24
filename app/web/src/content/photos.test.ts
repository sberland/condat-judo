import { describe, expect, it } from 'vitest'
import { finValiditePhoto } from './photos'

describe('finValiditePhoto', () => {
  it('un an après le dépôt', () => {
    expect(finValiditePhoto('2026-09-24 18:30:00')).toBe('2027-09-24')
    expect(finValiditePhoto('2028-02-29 08:00:00')).toBe('2029-03-01')
  })
})
