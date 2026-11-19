import { Pause, Play } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useState } from 'react'
import { ScoreBadge } from '@/components/risk/ScoreBadge'
import { Button } from '@/components/ui/button'
import { formatMoney, visibleItems, type FeedItem } from './decisionFeed'

const INTERVAL_MS = 2600

const outcomeClass: Record<FeedItem['outcome'], string> = {
  Approved: 'text-risk-low',
  'Held for review': 'text-risk-medium',
  Declined: 'text-risk-high',
}

/**
 * Decorative "live decisions" card for the hero. It auto-updates, so it has a pause control
 * (WCAG 2.2.2) and stays static when the user prefers reduced motion.
 */
export function HeroDecisionFeed() {
  const reduceMotion = useReducedMotion() ?? false
  const [paused, setPaused] = useState(false)
  const [offset, setOffset] = useState(0)
  const running = !reduceMotion && !paused

  useEffect(() => {
    if (!running) return
    const timer = window.setInterval(() => setOffset((o) => o + 1), INTERVAL_MS)
    return () => window.clearInterval(timer)
  }, [running])

  return (
    <figure className="w-full max-w-md rounded-2xl border bg-card/80 p-4 shadow-xl backdrop-blur">
      <figcaption className="mb-3 flex items-center justify-between px-1 text-xs font-medium text-muted-foreground">
        <span>Live decisions · sample data</span>
        {!reduceMotion && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => setPaused((p) => !p)}
          >
            {paused ? <Play aria-hidden="true" /> : <Pause aria-hidden="true" />}
            {paused ? 'Play' : 'Pause'}
          </Button>
        )}
      </figcaption>
      <ul className="flex flex-col gap-2">
        <AnimatePresence initial={false} mode="popLayout">
          {visibleItems(offset).map(({ key, item }) => (
            <motion.li
              key={key}
              layout={!reduceMotion}
              initial={reduceMotion ? false : { opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: 16 }}
              transition={{ duration: 0.35 }}
              className="flex items-center justify-between gap-3 rounded-xl border bg-background px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{item.merchant}</p>
                <p className="text-xs text-muted-foreground">
                  {formatMoney(item.amount, item.currency)} · {item.country}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <ScoreBadge score={item.score} />
                <span className={`text-xs font-medium ${outcomeClass[item.outcome]}`}>
                  {item.outcome}
                </span>
              </div>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </figure>
  )
}
