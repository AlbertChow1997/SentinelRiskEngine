import { Link } from 'react-router'
import { primaryNav } from '@/lib/navigation'

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-muted">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:justify-between">
        <div className="space-y-2">
          <p className="font-semibold">Sentinel Pay</p>
          <p className="text-sm text-muted-foreground">
            Portfolio project — not a real payment service.
          </p>
        </div>
        <nav aria-label="Footer">
          <ul className="flex flex-wrap gap-4 text-sm">
            {primaryNav.map((item) => (
              <li key={item.to}>
                <Link to={item.to} className="text-muted-foreground hover:text-foreground">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  )
}
