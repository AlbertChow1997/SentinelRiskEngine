import { Link } from 'react-router'
import { Button } from '@/components/ui/button'

// Shell only. The full homepage (hero visual, showcase, how-it-works, KPI strip, API snippet)
// lands in RISK-121.
export function HomePage() {
  return (
    <section className="bg-gradient-to-b from-accent to-background">
      <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6 sm:py-32">
        <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-balance sm:text-6xl">
          Payments that explain every risk decision.
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
          Sentinel Pay routes each payment through rules, a machine-learning score and an advisory
          AI summary, then shows you exactly why it was approved, held or declined.
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
    </section>
  )
}
