import { useState } from 'react'
import { Link, NavLink } from 'react-router'
import { primaryNav } from '@/lib/navigation'

function navLinkClass({ isActive }: { isActive: boolean }): string {
  return [
    'rounded-md px-3 py-2 text-sm font-medium transition-colors',
    isActive ? 'text-brand-700' : 'text-ink-muted hover:text-ink',
  ].join(' ')
}

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false)
  const closeMenu = () => setMenuOpen(false)

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2 font-semibold text-ink" onClick={closeMenu}>
          <img src="/logo.png" alt="" width={163} height={96} className="h-7 w-auto" />
          Sentinel Pay
        </Link>

        <nav aria-label="Primary" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {primaryNav.map((item) => (
              <li key={item.to}>
                <NavLink to={item.to} className={navLinkClass}>
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ml-auto hidden items-center gap-2 md:flex">
          <Link to="/login" className="px-3 py-2 text-sm font-medium text-ink-muted hover:text-ink">
            Log in
          </Link>
          <Link
            to="/signup"
            className="rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Sign up
          </Link>
        </div>

        <button
          type="button"
          className="ml-auto rounded-md px-3 py-2 text-sm font-medium text-ink md:hidden"
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? 'Close' : 'Menu'}
        </button>
      </div>

      {menuOpen && (
        <nav id="mobile-menu" aria-label="Mobile" className="border-t border-line md:hidden">
          <ul className="flex flex-col gap-1 px-4 py-3">
            {[
              ...primaryNav,
              { to: '/login', label: 'Log in' },
              { to: '/signup', label: 'Sign up' },
            ].map((item) => (
              <li key={item.to}>
                <NavLink to={item.to} className={navLinkClass} onClick={closeMenu}>
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  )
}
