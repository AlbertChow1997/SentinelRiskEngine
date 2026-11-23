import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router'
import { Reveal } from '@/components/motion/Reveal'
import { Button } from '@/components/ui/button'
import { DeveloperSnippet } from './DeveloperSnippet'
import { HowItWorks, KpiStrip, ProductShowcase } from './sections'
import { WaveBackdrop } from './WaveBackdrop'

// Hero copy in one place, so wording can be tuned without touching the layout.
const hero = {
  badge: 'Rules + machine learning + advisory AI',
  headline: ['Every payment, scored.', 'Every decision, explained.'],
  lead: 'Sentinel Pay routes each payment through rules, a machine-learning score and an advisory AI summary, then shows you exactly why it was approved, held or declined.',
}

// The stack behind the demo, shown as plain text (no third-party logos).
const stack = [
  'Java 21',
  'Spring Boot',
  'Kafka',
  'PostgreSQL',
  'FastAPI',
  'Amazon Bedrock',
  'React',
]

// Homepage from DESIGN.md §8.8.2. Layout inspired by modern fintech marketing sites; brand, copy,
// colours and visuals are our own.
export function HomePage() {
  return (
    <>
      <section className="relative isolate flex min-h-[44rem] flex-col overflow-hidden bg-hero text-hero-foreground sm:min-h-[50rem]">
        <WaveBackdrop />
        <div className="mx-auto flex max-w-5xl flex-1 flex-col items-center justify-center px-4 pt-32 pb-16 text-center sm:px-6">
          <p className="inline-flex items-center gap-2 rounded-full border border-hero-foreground/20 bg-hero/40 px-3 py-1 text-xs font-medium text-hero-muted backdrop-blur">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-hero-accent" />
            {hero.badge}
          </p>
          <h1 className="mt-8 text-5xl leading-[1.02] font-bold tracking-tighter sm:text-7xl">
            {hero.headline.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-hero-muted">{hero.lead}</p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Button
              asChild
              size="lg"
              className="bg-hero-cta text-hero-cta-foreground hover:bg-hero-cta/90"
            >
              <Link to="/signup">
                Start now
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-hero-foreground/50 bg-hero/30 text-hero-foreground backdrop-blur hover:bg-hero-foreground/10 hover:text-hero-foreground"
            >
              <Link to="/sample">See a sample</Link>
            </Button>
          </div>
        </div>

        <div className="border-t border-hero-foreground/10 bg-hero/70 backdrop-blur-md">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-10 gap-y-3 px-4 py-7 sm:px-6">
            <p className="text-xs font-semibold tracking-widest text-hero-muted uppercase">
              Built with
            </p>
            <ul className="contents">
              {stack.map((name) => (
                <li
                  key={name}
                  className="text-lg font-semibold tracking-tight text-hero-foreground/85"
                >
                  {name}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <KpiStrip />
      <ProductShowcase />
      <HowItWorks />
      <DeveloperSnippet />

      <section
        aria-labelledby="cta-heading"
        className="relative isolate overflow-hidden bg-hero text-hero-foreground"
      >
        <WaveBackdrop />
        <Reveal className="mx-auto flex max-w-6xl flex-col items-center px-4 pt-24 pb-44 text-center sm:px-6">
          <h2 id="cta-heading" className="text-4xl font-bold tracking-tighter sm:text-5xl">
            Watch a payment get decided
          </h2>
          <p className="mt-4 text-hero-muted">
            The sample runs in your browser on mock data. No sign-up needed.
          </p>
          <Button
            asChild
            size="lg"
            className="mt-8 bg-hero-cta text-hero-cta-foreground hover:bg-hero-cta/90"
          >
            <Link to="/sample">
              Try the sample
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </Reveal>
      </section>
    </>
  )
}
