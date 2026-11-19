import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { expectNoAxeViolations } from '@/test/axe'
import { ScoreBadge } from './ScoreBadge'

describe('ScoreBadge', () => {
  it.each([
    [12, 'Low'],
    [55, 'Medium'],
    [91, 'High'],
  ])('shows score %i with the text label %s, not colour alone', (score, label) => {
    render(<ScoreBadge score={score} />)

    expect(screen.getByText(String(score))).toBeInTheDocument()
    expect(screen.getByText(`· ${label}`)).toBeInTheDocument()
    expect(screen.getByText('Risk score')).toHaveClass('sr-only')
  })

  it('has no axe violations', async () => {
    const { container } = render(<ScoreBadge score={72} />)
    await expectNoAxeViolations(container)
  })
})
