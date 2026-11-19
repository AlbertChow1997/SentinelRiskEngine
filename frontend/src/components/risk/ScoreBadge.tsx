import { CircleAlert, CircleCheck, TriangleAlert, type LucideIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { scoreBand, scoreBandLabel, type ScoreBand } from './scoreBand'

const bandIcon: Record<ScoreBand, LucideIcon> = {
  low: CircleCheck,
  medium: TriangleAlert,
  high: CircleAlert,
}

interface ScoreBadgeProps {
  score: number
  className?: string
}

/** Risk score with its band. The band is shown as icon + text, never by colour alone. */
export function ScoreBadge({ score, className }: ScoreBadgeProps) {
  const band = scoreBand(score)
  const Icon = bandIcon[band]
  const label = scoreBandLabel[band]

  return (
    <Badge variant={`risk-${band}`} className={className}>
      <Icon aria-hidden="true" />
      <span className="sr-only">Risk score</span>
      <span className="tabular-nums">{score}</span>
      <span>· {label}</span>
    </Badge>
  )
}
