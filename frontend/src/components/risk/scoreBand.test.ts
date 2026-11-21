import { describe, expect, it } from 'vitest'
import { scoreBand } from './scoreBand'

describe('scoreBand', () => {
  it.each([
    [0, 'low'],
    [39, 'low'],
    [40, 'medium'],
    [69, 'medium'],
    [70, 'high'],
    [100, 'high'],
  ] as const)('maps %i to %s', (score, band) => {
    expect(scoreBand(score)).toBe(band)
  })

  it.each([-1, 101, Number.NaN])('rejects %f', (score) => {
    expect(() => scoreBand(score)).toThrow(RangeError)
  })
})
