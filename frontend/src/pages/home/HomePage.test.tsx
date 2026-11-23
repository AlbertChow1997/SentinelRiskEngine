import { act, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { expectNoAxeViolations } from '@/test/axe'
import { renderRoute } from '@/test/renderRoute'
import { decisionFeed, visibleItems } from './decisionFeed'

describe('HomePage', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders every section from the information architecture', () => {
    renderRoute('/')

    for (const name of [
      'One flow from checkout to decision',
      'How a payment is decided',
      'Design targets',
      'One request, a decision you can explain',
      'Watch a payment get decided',
    ]) {
      expect(screen.getByRole('heading', { level: 2, name })).toBeInTheDocument()
    }
    for (const product of ['Payments', 'Risk Engine', 'AI insights']) {
      expect(screen.getByRole('heading', { level: 3, name: product })).toBeInTheDocument()
    }
  })

  it('lists the five decision steps in order', () => {
    renderRoute('/')

    const list = screen.getByRole('list', { name: 'How a payment is decided' })
    const titles = within(list)
      .getAllByRole('heading', { level: 3 })
      .map((h) => h.textContent)
    expect(titles).toEqual(['Gateway', 'Rules', 'ML score', 'Decision', 'AI summary'])
  })

  it('shows the risk assessment request from the contract', () => {
    renderRoute('/')

    expect(
      screen.getByText(/POST https:\/\/<your-host>\/api\/v1\/risk-assessments/),
    ).toBeInTheDocument()
  })

  it('rotates the live decision feed and can be paused', async () => {
    vi.useFakeTimers()
    renderRoute('/')
    const next = decisionFeed[4]?.merchant ?? ''
    expect(screen.queryByText(next)).not.toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(2600)
    })
    expect(screen.getByText(next)).toBeInTheDocument()

    vi.useRealTimers()
    await userEvent.setup().click(screen.getByRole('button', { name: 'Pause' }))
    expect(screen.getByRole('button', { name: 'Play' })).toBeInTheDocument()
  })

  it('keeps feed rows keyed by position so remaining rows do not remount', () => {
    expect(visibleItems(1).map((v) => v.key)).toEqual([1, 2, 3, 4])
    expect(visibleItems(decisionFeed.length).at(0)?.item).toEqual(decisionFeed[0])
  })

  it('has no axe violations', async () => {
    const { container } = renderRoute('/')
    await expectNoAxeViolations(container)
  })
})
