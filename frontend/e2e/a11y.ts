import AxeBuilder from '@axe-core/playwright'
import { expect, type Page } from '@playwright/test'

// WCAG 2.0 / 2.1 A and AA, including colour contrast (which jsdom cannot check).
const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']

export async function expectNoAxeViolations(page: Page, include?: string): Promise<void> {
  let builder = new AxeBuilder({ page }).withTags(WCAG_TAGS)
  if (include) builder = builder.include(include)
  const { violations } = await builder.analyze()
  const summary = violations.map(
    (v) => `${v.id} (${v.impact ?? 'n/a'}): ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`,
  )
  expect(summary).toEqual([])
}
