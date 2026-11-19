import { isRouteErrorResponse, Link, useRouteError } from 'react-router'

export function RouteErrorPage() {
  const error = useRouteError()
  const message = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : 'Something went wrong while loading this page.'

  return (
    <section role="alert" className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight">Unexpected error</h1>
      <p className="mt-4 text-ink-muted">{message}</p>
      <Link to="/" className="mt-6 inline-block font-semibold text-brand-700 underline">
        Back to the homepage
      </Link>
    </section>
  )
}
