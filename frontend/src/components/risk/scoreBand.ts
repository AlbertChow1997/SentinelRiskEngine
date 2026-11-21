// Score bands match the backend thresholds (DESIGN.md §8.3).
export type ScoreBand = 'low' | 'medium' | 'high'

export const scoreBandLabel: Record<ScoreBand, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
}

export function scoreBand(score: number): ScoreBand {
  if (!Number.isFinite(score) || score < 0 || score > 100) {
    throw new RangeError(`Risk score must be between 0 and 100, got ${score}`)
  }
  if (score >= 70) return 'high'
  if (score >= 40) return 'medium'
  return 'low'
}
