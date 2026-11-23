import {
  Activity,
  BrainCircuit,
  CreditCard,
  ListChecks,
  Scale,
  ShieldCheck,
  Sparkles,
  type LucideIcon,
} from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { HeroDecisionFeed } from './HeroDecisionFeed'
import { Reveal } from '@/components/motion/Reveal'

interface Product {
  icon: LucideIcon
  title: string
  description: string
  points: string[]
}

const products: Product[] = [
  {
    icon: CreditCard,
    title: 'Payments',
    description: 'A gateway with the lifecycle a real merchant integration needs.',
    points: ['Idempotency keys on every write', 'Authorise, capture, refund', 'Signed webhooks'],
  },
  {
    icon: ShieldCheck,
    title: 'Risk Engine',
    description: 'Every payment is scored before it moves, in well under a second.',
    points: ['Explainable rule hits', 'Machine-learning fraud score', 'Analyst review queue'],
  },
  {
    icon: BrainCircuit,
    title: 'AI insights',
    description: 'A plain-language case summary for analysts. Advisory only.',
    points: ['Grounded in real feature values', 'Never changes a decision', 'Works without it'],
  },
]

// Illustrative decision mix for the sample data, not live measurements.
const decisionMix = [
  { label: 'Approved', value: 82, bar: 'bg-risk-low' },
  { label: 'Held for review', value: 12, bar: 'bg-risk-medium' },
  { label: 'Declined', value: 6, bar: 'bg-risk-high' },
]

/** Platform panel: a decision mix over the live decision feed, both on sample data. */
function PlatformPanel() {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-accent via-secondary to-hero-accent/40 p-6 sm:p-10">
      <div aria-hidden="true" className="grid grid-cols-3 gap-3">
        {decisionMix.map((item) => (
          <div key={item.label} className="rounded-xl border bg-card p-4 shadow-sm">
            <p className="truncate text-xs font-medium text-muted-foreground">{item.label}</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums">{item.value}%</p>
            <div className="mt-3 h-1.5 rounded-full bg-border">
              <div
                className={`h-full rounded-full ${item.bar}`}
                style={{ width: `${item.value}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3">
        <HeroDecisionFeed />
      </div>
    </div>
  )
}

export function ProductShowcase() {
  return (
    <section aria-labelledby="products-heading" className="bg-muted">
      <div className="mx-auto grid max-w-6xl gap-12 border-x px-4 py-24 sm:px-8 lg:grid-cols-[1fr_1.15fr] lg:items-center">
        <Reveal>
          <p className="flex items-center gap-2 text-sm font-medium">
            <span aria-hidden="true" className="size-2 rounded-full bg-highlight" />
            The platform
          </p>
          <h2
            id="products-heading"
            className="mt-4 text-4xl font-bold tracking-tighter text-balance sm:text-5xl"
          >
            One flow from checkout to decision
          </h2>
          <ul className="mt-10">
            {products.map((product) => (
              <li key={product.title} className="flex gap-4 border-t py-5">
                <product.icon aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-brand" />
                <div>
                  <h3 className="font-semibold">{product.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{product.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </Reveal>
        <Reveal delay={0.1}>
          <PlatformPanel />
        </Reveal>
      </div>
    </section>
  )
}

const steps: { icon: LucideIcon; title: string; detail: string }[] = [
  {
    icon: CreditCard,
    title: 'Gateway',
    detail: 'The merchant creates a payment with an idempotency key.',
  },
  {
    icon: ListChecks,
    title: 'Rules',
    detail: 'Velocity, amount, country and blocklist rules add to the score.',
  },
  {
    icon: Activity,
    title: 'ML score',
    detail: 'A fraud model adds its probability and top factors.',
  },
  {
    icon: Scale,
    title: 'Decision',
    detail: 'Approve, hold for review or decline, with every reason listed.',
  },
  {
    icon: Sparkles,
    title: 'AI summary',
    detail: 'Held cases get an advisory summary for the analyst.',
  },
]

export function HowItWorks() {
  const reduceMotion = useReducedMotion()

  return (
    <section aria-labelledby="how-heading" className="bg-background">
      <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
        <Reveal>
          <p className="text-sm font-semibold text-brand">How it works</p>
          <h2 id="how-heading" className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            How a payment is decided
          </h2>
        </Reveal>
        <div className="relative mt-14">
          {/* The connecting track: vertical on small screens, horizontal from md up. */}
          <div
            aria-hidden="true"
            className="absolute top-0 bottom-0 left-6 w-px bg-border md:top-6 md:right-[10%] md:bottom-auto md:left-[10%] md:h-px md:w-auto"
          >
            <motion.div
              className="size-full origin-top bg-gradient-to-b from-brand to-highlight md:origin-left md:bg-gradient-to-r"
              initial={reduceMotion ? false : { scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true, margin: '-120px' }}
              transition={{ duration: 1.2, ease: 'easeInOut' }}
            />
          </div>
          <ol
            aria-labelledby="how-heading"
            className="relative grid gap-10 md:grid-cols-5 md:gap-6"
          >
            {steps.map((step, index) => (
              <li key={step.title}>
                <Reveal
                  delay={0.15 + index * 0.2}
                  className="flex gap-5 md:flex-col md:items-center md:text-center"
                >
                  <span className="relative flex size-12 shrink-0 items-center justify-center rounded-2xl border border-highlight/40 bg-accent text-brand shadow-sm">
                    <step.icon aria-hidden="true" className="size-5" />
                    <span className="absolute -top-2 -right-2 flex size-5 items-center justify-center rounded-full bg-primary text-[0.65rem] font-semibold text-primary-foreground">
                      {index + 1}
                    </span>
                  </span>
                  <div>
                    <h3 className="font-semibold">{step.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{step.detail}</p>
                  </div>
                </Reveal>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}

// Design targets from DESIGN.md (G1 and the golden rules), not live measurements.
const kpis = [
  { value: '<250ms', label: 'p95 decision' },
  { value: '100%', label: 'Decisions with reasons' },
  { value: '0', label: 'Card numbers stored' },
]

export function KpiStrip() {
  return (
    <section aria-labelledby="kpi-heading" className="border-b bg-muted">
      <div className="mx-auto max-w-6xl border-x">
        <div aria-hidden="true" className="h-16 border-b" />
        <div className="grid md:grid-cols-[1.6fr_repeat(3,1fr)]">
          <div className="p-8 md:border-r">
            <h2
              id="kpi-heading"
              className="text-xs font-semibold tracking-widest text-muted-foreground uppercase"
            >
              Design targets
            </h2>
            <p className="mt-4 max-w-sm text-xl leading-snug">
              Sentinel Pay turns every payment into a decision you can read, defend and tune.
            </p>
          </div>
          <dl className="contents">
            {kpis.map((kpi) => (
              <div
                key={kpi.label}
                className="flex flex-col-reverse justify-end gap-3 border-t p-8 md:border-t-0 md:border-r md:last:border-r-0"
              >
                <dt className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                  {kpi.label}
                </dt>
                <dd className="bg-gradient-to-r from-brand to-highlight bg-clip-text text-5xl font-semibold tracking-tighter text-transparent tabular-nums">
                  {kpi.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  )
}
