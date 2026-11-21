import { expect, test } from '@playwright/test'
import { expectNoAxeViolations } from './a11y.ts'

const STORYBOOK = 'http://localhost:6006'

interface StoryIndex {
  entries: Record<string, { id: string; type: 'story' | 'docs' }>
}

// The a11y addon's own run is switched off (a11y.manual) so it does not race this axe run.
// One test per story in the static Storybook build, so a new story is checked automatically.
test('every story has no WCAG A/AA violations in a real browser', async ({ page, request }) => {
  const index = (await (await request.get(`${STORYBOOK}/index.json`)).json()) as StoryIndex
  const stories = Object.values(index.entries).filter((e) => e.type === 'story')
  expect(stories.length).toBeGreaterThan(0)

  for (const story of stories) {
    await test.step(story.id, async () => {
      await page.goto(
        `${STORYBOOK}/iframe.html?viewMode=story&id=${story.id}&globals=a11y.manual:!true`,
      )
      await page.locator('#storybook-root > *').first().waitFor()
      await expectNoAxeViolations(page, '#storybook-root')
    })
  }
})
