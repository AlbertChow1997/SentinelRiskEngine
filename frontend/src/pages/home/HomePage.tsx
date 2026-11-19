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
      <section className="relative overflow-hidden">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-40 -left-32 size-[32rem] rounded-full bg-brand/25 blur-3xl" />
          <div className="absolute top-20 right-[-10rem] size-[28rem] rounded-full bg-highlight/30 blur-3xl" />
        </div>
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 sm:px-6 sm:py-28 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-balance sm:text-6xl">
              Payments that explain every risk decision.
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
              Sentinel Pay routes each payment through rules, a machine-learning score and an
              advisory AI summary, then shows you exactly why it was approved, held or declined.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Button asChild size="lg">
                <Link to="/signup">Start now</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/sample">See a sample</Link>
              </Button>
            </div>
          </div>
          <HeroDecisionFeed />
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
