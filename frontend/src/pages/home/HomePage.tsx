import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router'
import { Reveal } from '@/components/motion/Reveal'
import { Button } from '@/components/ui/button'
import { DeveloperSnippet } from './DeveloperSnippet'
import { HeroDecisionFeed } from './HeroDecisionFeed'
import { HowItWorks, KpiStrip, ProductShowcase } from './sections'

// Homepage from DESIGN.md §8.8.2. Layout inspired by modern fintech sites; brand, copy,
// colours and visuals are our own.
export function HomePage() {
  return (
    <>
      <section className="relative isolate overflow-hidden bg-hero text-hero-foreground">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-48 -left-40 size-[38rem] animate-drift rounded-full bg-hero-glow-1/55 blur-[120px]" />
          <div className="absolute top-10 -right-48 size-[34rem] animate-drift-slow rounded-full bg-hero-glow-2/35 blur-[120px]" />
          <div className="absolute -bottom-56 left-1/3 size-[30rem] animate-drift rounded-full bg-hero-glow-3/35 blur-[120px]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--hero-foreground)_1px,transparent_1px),linear-gradient(to_bottom,var(--hero-foreground)_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_at_center,black_10%,transparent_70%)] bg-[size:56px_56px] opacity-[0.06]" />
        </div>
        <div className="mx-auto grid max-w-6xl items-center gap-16 px-4 pt-20 pb-24 sm:px-6 sm:pt-28 sm:pb-32 lg:grid-cols-[1.15fr_1fr]">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-hero-foreground/15 bg-hero-foreground/5 px-3 py-1 text-xs font-medium text-hero-muted">
              <span aria-hidden="true" className="size-1.5 rounded-full bg-highlight" />
              Rules + machine learning + advisory AI
            </p>
            <h1 className="mt-6 text-5xl leading-[1.05] font-bold tracking-tight text-balance sm:text-7xl">
              Payments that{' '}
              <span className="bg-gradient-to-r from-hero-accent via-highlight to-hero-glow-3 bg-clip-text text-transparent">
                explain every risk decision.
              </span>
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
                className="border-hero-foreground/30 bg-transparent text-hero-foreground hover:bg-hero-foreground/10 hover:text-hero-foreground"
              >
                <Link to="/sample">See a sample</Link>
              </Button>
            </div>
          </div>
          <div className="relative lg:[perspective:1400px]">
            <div className="lg:[transform:rotateY(-10deg)_rotateX(4deg)] lg:transition-transform lg:duration-500 lg:hover:[transform:rotateY(-4deg)_rotateX(2deg)]">
              <HeroDecisionFeed />
            </div>
            <div
              aria-hidden="true"
              className="absolute -bottom-6 -left-6 hidden rounded-xl border border-hero-foreground/15 bg-hero/80 px-4 py-3 text-sm shadow-2xl backdrop-blur sm:block"
            >
              <p className="text-xs text-hero-muted">AI summary · advisory</p>
              <p className="mt-1 max-w-56 text-hero-foreground">
                6 payments in 10 minutes; amounts look normal for digital goods.
              </p>
            </div>
          </div>
        </div>
      </section>

      <ProductShowcase />
      <HowItWorks />
      <KpiStrip />
      <DeveloperSnippet />

      <section aria-labelledby="cta-heading" className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
        <Reveal className="flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 id="cta-heading" className="text-3xl font-bold tracking-tight">
              Watch a payment get decided
            </h2>
            <p className="mt-2 text-muted-foreground">
              The sample runs in your browser on mock data. No sign-up needed.
            </p>
          </div>
          <Button asChild size="lg" variant="brand">
            <Link to="/sample">Try the sample</Link>
          </Button>
        </Reveal>
      </section>
    </>
  )
}
