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
import { Reveal } from '@/components/motion/Reveal'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

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

export function ProductShowcase() {
  return (
    <section aria-labelledby="products-heading" className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
      <Reveal>
        <p className="text-sm font-semibold text-brand">The platform</p>
        <h2 id="products-heading" className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          One flow from checkout to decision
        </h2>
      </Reveal>
      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {products.map((product, index) => (
          <Reveal key={product.title} delay={index * 0.1}>
            <Card className="h-full transition-shadow hover:shadow-md">
              <CardHeader>
                <product.icon aria-hidden="true" className="mb-2 size-8 text-brand" />
                <CardTitle>{product.title}</CardTitle>
                <CardDescription>{product.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="flex flex-col gap-2 text-sm">
                  {product.points.map((point) => (
                    <li key={point} className="flex gap-2">
                      <span aria-hidden="true" className="text-highlight">
                        ✓
                      </span>
                      {point}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </Reveal>
        ))}
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
    <section aria-labelledby="how-heading" className="border-y bg-muted">
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
                  <span className="relative flex size-12 shrink-0 items-center justify-center rounded-2xl border bg-card text-brand shadow-sm">
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
  { value: '< 250 ms', label: 'p95 risk decision target' },
  { value: '3', label: 'signals per decision: rules, ML, analyst' },
  { value: '100%', label: 'of decisions list their reasons' },
  { value: '0', label: 'card numbers stored' },
]

export function KpiStrip() {
  return (
    <section aria-labelledby="kpi-heading" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <h2 id="kpi-heading" className="text-sm font-semibold text-muted-foreground">
        Design targets
      </h2>
      <dl className="mt-6 grid grid-cols-2 gap-8 md:grid-cols-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="flex flex-col-reverse gap-1 border-l-2 border-l-highlight pl-4"
          >
            <dt className="text-sm text-muted-foreground">{kpi.label}</dt>
            <dd className="text-3xl font-bold tracking-tight">{kpi.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
