import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, Link, RouterProvider } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { expectNoAxeViolations } from '@/test/axe'
import { Button } from './button'

describe('Button', () => {
  it('is a native button that responds to clicks', async () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Pay</Button>)

    await userEvent.setup().click(screen.getByRole('button', { name: 'Pay' }))

    expect(onClick).toHaveBeenCalledOnce()
  })

  it('renders a router link with button styles when asChild is set', () => {
    const router = createMemoryRouter([
      {
        path: '/',
        element: (
          <Button asChild variant="outline">
            <Link to="/sample">See a sample</Link>
          </Button>
        ),
      },
    ])
    render(<RouterProvider router={router} />)

    const link = screen.getByRole('link', { name: 'See a sample' })
    expect(link).toHaveAttribute('href', '/sample')
    expect(link).toHaveAttribute('data-slot', 'button')
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('has no axe violations', async () => {
    const { container } = render(<Button>Pay</Button>)
    await expectNoAxeViolations(container)
  })
})
