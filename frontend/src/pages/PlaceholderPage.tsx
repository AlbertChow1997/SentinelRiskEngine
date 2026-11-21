interface PlaceholderPageProps {
  title: string
  ticket: string
}

export function PlaceholderPage({ title, ticket }: PlaceholderPageProps) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
      <p className="mt-4 text-muted-foreground">This page is coming soon ({ticket}).</p>
    </section>
  )
}
