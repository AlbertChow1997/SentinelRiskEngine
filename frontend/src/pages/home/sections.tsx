import { BrainCircuit, CreditCard, ShieldCheck, type LucideIcon } from 'lucide-react'
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

const steps = [
  { title: 'Gateway', detail: 'The merchant creates a payment with an idempotency key.' },
  { title: 'Rules', detail: 'Velocity, amount, country and blocklist rules add to the score.' },
  { title: 'ML score', detail: 'A fraud model adds its probability and top factors.' },
  { title: 'Decision', detail: 'Approve, hold for review or decline, with every reason listed.' },
  { title: 'AI summary', detail: 'Held cases get an advisory summary for the analyst.' },
]

export function HowItWorks() {
  return (
    <section aria-labelledby="how-heading" className="border-y bg-muted">
      <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
        <Reveal>
          <h2 id="how-heading" className="text-3xl font-bold tracking-tight sm:text-4xl">
            How a payment is decided
          </h2>
        </Reveal>
        <ol aria-labelledby="how-heading" className="mt-12 grid gap-6 md:grid-cols-5">
          {steps.map((step, index) => (
            <li key={step.title}>
              <Reveal delay={index * 0.08} className="flex flex-col gap-2">
                <span className="flex size-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                  {index + 1}
                </span>
                <h3 className="font-semibold">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.detail}</p>
              </Reveal>
            </li>
          ))}
        </ol>
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
