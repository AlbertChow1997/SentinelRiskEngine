import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router'
import { Reveal } from '@/components/motion/Reveal'
import { Button } from '@/components/ui/button'
import { DeveloperSnippet } from './DeveloperSnippet'
import { HeroDecisionFeed } from './HeroDecisionFeed'
import { HowItWorks, KpiStrip, ProductShowcase } from './sections'
import { WaveBackdrop } from './WaveBackdrop'

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
      <section className="relative isolate overflow-hidden bg-hero text-hero-foreground">
        <WaveBackdrop />
        <div className="mx-auto grid max-w-6xl items-end gap-14 px-4 pt-36 pb-20 sm:px-6 sm:pt-44 sm:pb-28 lg:min-h-[50rem] lg:grid-cols-[1.5fr_1fr] lg:items-center">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-hero-foreground/20 bg-hero-foreground/5 px-3 py-1 text-xs font-medium text-hero-muted backdrop-blur">
              <span aria-hidden="true" className="size-1.5 rounded-full bg-hero-accent" />
              Rules + machine learning + advisory AI
            </p>
            <h1 className="mt-8 text-4xl leading-[0.95] font-extrabold tracking-tight uppercase sm:text-6xl">
              <span className="block">Every payment, scored.</span>
              <span className="block">Every decision, explained.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-hero-muted">
              Sentinel Pay routes each payment through rules, a machine-learning score and an
              advisory AI summary, then shows you exactly why it was approved, held or declined.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Button
                asChild
                size="lg"
                className="bg-hero-foreground text-hero hover:bg-hero-foreground/90"
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
                className="border-hero-foreground/40 bg-hero/30 text-hero-foreground backdrop-blur hover:bg-hero-foreground/10 hover:text-hero-foreground"
              >
                <Link to="/sample">See a sample</Link>
              </Button>
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-md lg:[perspective:1400px]">
            <div className="lg:[transform:rotateY(-8deg)_rotateX(4deg)]">
              <HeroDecisionFeed />
            </div>
          </div>
        </div>
      </section>

      <section aria-label="Technology" className="border-b bg-background">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-10 gap-y-3 px-4 py-8 sm:px-6">
          <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
            Built with
          </p>
          <ul className="contents">
            {stack.map((name) => (
              <li key={name} className="text-lg font-semibold tracking-tight text-foreground/80">
                {name}
              </li>
            ))}
          </ul>
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
        <Reveal className="mx-auto flex max-w-6xl flex-col items-start px-4 pt-24 pb-48 sm:px-6">
          <h2
            id="cta-heading"
            className="text-4xl font-extrabold tracking-tight uppercase sm:text-5xl"
          >
            Watch a payment get decided
          </h2>
          <p className="mt-4 text-hero-muted">
            The sample runs in your browser on mock data. No sign-up needed.
          </p>
          <Button
            asChild
            size="lg"
            className="mt-8 bg-hero-foreground text-hero hover:bg-hero-foreground/90"
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
