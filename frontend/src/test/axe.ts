import axe from 'axe-core'
import { expect } from 'vitest'

/**
 * Runs axe-core against a rendered container. jsdom cannot compute colour contrast, so that
 * rule is checked in Storybook's a11y panel and Playwright instead.
 */
export async function expectNoAxeViolations(container: Element): Promise<void> {
  const results = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } })
  const summary = results.violations.map((v) => `${v.id}: ${v.help}`)
  expect(summary).toEqual([])
}
