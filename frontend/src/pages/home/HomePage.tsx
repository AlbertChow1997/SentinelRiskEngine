import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router'
import { Reveal } from '@/components/motion/Reveal'
import { Button } from '@/components/ui/button'
import { DeveloperSnippet } from './DeveloperSnippet'
import { HeroDecisionFeed } from './HeroDecisionFeed'
import { HowItWorks, KpiStrip, ProductShowcase } from './sections'

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

/** Decorative dark backdrop: a glowing horizon in our navy, lavender and sky blue. */
function HorizonBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
      <div className="absolute inset-x-[-20%] bottom-[-35%] h-[90%] rounded-[100%] bg-[radial-gradient(ellipse_at_center,var(--hero-glow-3)_0%,var(--hero-glow-2)_28%,var(--hero-glow-1)_58%,transparent_72%)] opacity-70 blur-2xl" />
      <div className="absolute -top-40 left-1/2 h-[28rem] w-[60rem] -translate-x-1/2 rounded-full bg-hero-glow-1 opacity-80 blur-[120px]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--hero-foreground)_1px,transparent_1px),linear-gradient(to_bottom,var(--hero-foreground)_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_at_top,black_20%,transparent_70%)] bg-[size:64px_64px] opacity-[0.05]" />
    </div>
  )
}

// Homepage from DESIGN.md §8.8.2. Layout inspired by modern fintech marketing sites; brand, copy,
// colours and visuals are our own.
export function HomePage() {
  return (
    <>
      <section className="relative isolate overflow-hidden bg-hero text-hero-foreground">
        <HorizonBackdrop />
        <div className="mx-auto flex max-w-6xl flex-col items-center px-4 pt-36 pb-20 text-center sm:px-6 sm:pt-44">
          <p className="inline-flex items-center gap-2 rounded-full border border-hero-foreground/15 bg-hero-foreground/5 px-3 py-1 text-xs font-medium text-hero-muted backdrop-blur">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-hero-accent" />
            Rules + machine learning + advisory AI
          </p>
          <h1 className="mt-8 text-5xl leading-[1.02] font-bold tracking-tighter text-balance sm:text-7xl">
            Every payment, scored.
            <span className="block bg-gradient-to-r from-hero-accent via-hero-foreground to-hero-glow-2 bg-clip-text text-transparent">
              Every decision, explained.
            </span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-hero-muted">
            Sentinel Pay routes each payment through rules, a machine-learning score and an advisory
            AI summary, then shows you exactly why it was approved, held or declined.
          </p>
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
              className="border-hero-foreground/40 bg-transparent text-hero-foreground hover:bg-hero-foreground/10 hover:text-hero-foreground"
            >
              <Link to="/sample">See a sample</Link>
            </Button>
          </div>

          <div className="relative mt-20 w-full max-w-md [perspective:1400px]">
            <div className="sm:[transform:rotateX(10deg)]">
              <HeroDecisionFeed />
            </div>
            <div
              aria-hidden="true"
              className="absolute top-1/2 -right-56 hidden w-60 rounded-xl border border-hero-foreground/15 bg-hero/70 px-4 py-3 text-left text-sm shadow-2xl backdrop-blur lg:block"
            >
              <p className="text-xs text-hero-muted">AI summary · advisory</p>
              <p className="mt-1 text-hero-foreground">
                6 payments in 10 minutes; amounts look normal for digital goods.
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-hero-foreground/10 bg-hero/80 backdrop-blur">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-10 gap-y-3 px-4 py-8 sm:px-6">
            <p className="text-xs font-semibold tracking-widest text-hero-muted uppercase">
              Built with
            </p>
            <ul className="contents">
              {stack.map((name) => (
                <li
                  key={name}
                  className="text-lg font-semibold tracking-tight text-hero-foreground/80"
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
        <HorizonBackdrop />
        <Reveal className="mx-auto flex max-w-6xl flex-col items-center px-4 py-28 text-center sm:px-6">
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
