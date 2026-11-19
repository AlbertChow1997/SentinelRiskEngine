import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderRoute } from '@/test/renderRoute'

describe('site shell', () => {
  it('renders the homepage hero with both calls to action', () => {
    renderRoute('/')

    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Start now' })).toHaveAttribute('href', '/signup')
    expect(screen.getByRole('link', { name: 'See a sample' })).toHaveAttribute('href', '/sample')
  })

  it('shows the primary navigation in the documented order', () => {
    renderRoute('/')

    const nav = screen.getByRole('navigation', { name: 'Primary' })
    const labels = within(nav)
      .getAllByRole('link')
      .map((link) => link.textContent)
    expect(labels).toEqual(['Product', 'Sample', 'About us', 'Pricing'])
  })

  it('shows the portfolio disclaimer in the footer on every page', () => {
    for (const path of ['/', '/about', '/does-not-exist']) {
      const { unmount } = renderRoute(path)
      expect(
        within(screen.getByRole('contentinfo')).getByText(
          'Portfolio project — not a real payment service.',
        ),
      ).toBeInTheDocument()
      unmount()
    }
  })

  it('marks the current page in the navigation', () => {
    renderRoute('/about')

    const nav = screen.getByRole('navigation', { name: 'Primary' })
    expect(within(nav).getByRole('link', { name: 'About us' })).toHaveAttribute(
      'aria-current',
      'page',
    )
  })

  it('renders a not-found page for unknown routes', () => {
    renderRoute('/does-not-exist')

    expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument()
  })

  it('offers a skip link to the main content', () => {
    renderRoute('/')

    expect(screen.getByRole('link', { name: 'Skip to content' })).toHaveAttribute('href', '#main')
  })

  it('toggles the mobile menu and reports its state', async () => {
    const user = userEvent.setup()
    renderRoute('/')

    const toggle = screen.getByRole('button', { name: 'Menu' })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')

    await user.click(toggle)

    expect(screen.getByRole('button', { name: 'Close' })).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('navigation', { name: 'Mobile' })).toBeInTheDocument()
  })
})
