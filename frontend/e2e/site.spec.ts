import { expect, test } from '@playwright/test'
import { expectNoAxeViolations } from './a11y.ts'

const BASE = 'http://localhost:4173'
const routes = ['/', '/sample', '/about', '/pricing', '/does-not-exist']

for (const route of routes) {
  test(`${route} has no WCAG A/AA violations`, async ({ page }) => {
    await page.goto(BASE + route)
    await expect(page.getByRole('contentinfo')).toContainText(
      'Portfolio project — not a real payment service.',
    )
    await expectNoAxeViolations(page)
  })
}

test('homepage calls to action lead to sign-up and the sample', async ({ page }) => {
  await page.goto(BASE + '/')
  await page.getByRole('link', { name: 'See a sample' }).click()
  await expect(page).toHaveURL(/\/sample$/)
})

test('mobile menu is keyboard operable and has no violations when open', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(BASE + '/')
  const toggle = page.getByRole('button', { name: 'Menu' })
  await toggle.focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('navigation', { name: 'Mobile' })).toBeVisible()
  await expectNoAxeViolations(page)
})
