import { Link } from 'react-router'

// Shell only. The full homepage (hero visual, showcase, how-it-works, KPI strip, API snippet)
// lands in RISK-121.
export function HomePage() {
  return (
    <section className="bg-gradient-to-b from-brand-50 to-surface">
      <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6 sm:py-32">
        <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-balance sm:text-6xl">
          Payments that explain every risk decision.
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-ink-muted">
          Sentinel Pay routes each payment through rules, a machine-learning score and an advisory
          AI summary, then shows you exactly why it was approved, held or declined.
        </p>
        <div className="mt-10 flex flex-wrap gap-4">
          <Link
            to="/signup"
            className="rounded-full bg-brand-600 px-6 py-3 font-semibold text-white hover:bg-brand-700"
          >
            Start now
          </Link>
          <Link
            to="/sample"
            className="rounded-full border border-line px-6 py-3 font-semibold text-ink hover:border-brand-500"
          >
            See a sample
          </Link>
        </div>
      </div>
    </section>
  )
}
