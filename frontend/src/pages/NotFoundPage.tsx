import { Link } from 'react-router'

export function NotFoundPage() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight">Page not found</h1>
      <p className="mt-4 text-ink-muted">We could not find the page you were looking for.</p>
      <Link to="/" className="mt-6 inline-block font-semibold text-brand-700 underline">
        Back to the homepage
      </Link>
    </section>
  )
}
