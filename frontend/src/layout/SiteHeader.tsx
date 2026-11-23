import { useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router'
import { Button } from '@/components/ui/button'
import { primaryNav } from '@/lib/navigation'
import { cn } from '@/lib/utils'

/**
 * Site header. On the homepage it floats as a glass bar over the dark hero; on every other
 * page it is a sticky light bar.
 */
export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false)
  const closeMenu = () => setMenuOpen(false)
  const onDark = useLocation().pathname === '/'

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'rounded-md px-3 py-2 text-sm font-medium transition-colors',
      onDark
        ? isActive
          ? 'text-hero-accent'
          : 'text-hero-muted hover:text-hero-foreground'
        : isActive
          ? 'text-brand'
          : 'text-muted-foreground hover:text-foreground',
    )

  return (
    <header
      className={cn(
        'z-40',
        onDark
          ? 'absolute inset-x-0 top-0 px-4 pt-4 sm:px-6'
          : 'sticky top-0 border-b border-border bg-background/90 backdrop-blur',
      )}
    >
      <div
        className={cn(
          'mx-auto max-w-6xl',
          onDark &&
            'rounded-2xl border border-hero-foreground/15 bg-hero-foreground/5 text-hero-foreground backdrop-blur-md',
        )}
      >
        <div
          className={cn(
            'flex items-center gap-6',
            onDark ? 'h-14 px-4 sm:px-5' : 'h-16 px-4 sm:px-6',
          )}
        >
          <Link
            to="/"
            className={cn(
              'flex items-center gap-2 font-semibold',
              onDark ? 'text-hero-foreground' : 'text-foreground',
            )}
            onClick={closeMenu}
          >
            <img
              src={onDark ? '/logo-light.png' : '/logo.png'}
              alt=""
              width={163}
              height={96}
              className="h-6 w-auto"
            />
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
            <Button
              asChild
              variant="ghost"
              size="sm"
              className={cn(
                onDark && 'text-hero-muted hover:bg-hero-foreground/10 hover:text-hero-foreground',
              )}
            >
              <Link to="/login">Log in</Link>
            </Button>
            <Button
              asChild
              size="sm"
              className={cn(onDark && 'bg-hero-foreground text-hero hover:bg-hero-foreground/90')}
            >
              <Link to="/signup">Sign up</Link>
            </Button>
          </div>

          <button
            type="button"
            className={cn(
              'ml-auto rounded-md px-3 py-2 text-sm font-medium md:hidden',
              onDark ? 'text-hero-foreground' : 'text-foreground',
            )}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? 'Close' : 'Menu'}
          </button>
        </div>

        {menuOpen && (
          <nav
            id="mobile-menu"
            aria-label="Mobile"
            className={cn(
              'border-t md:hidden',
              onDark ? 'border-hero-foreground/15' : 'border-border',
            )}
          >
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
      </div>
    </header>
  )
}
