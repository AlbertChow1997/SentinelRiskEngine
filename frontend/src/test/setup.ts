import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// jsdom does not implement scrolling; React Router's ScrollRestoration calls it on navigation.
vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined)

// jsdom has no IntersectionObserver; Motion's whileInView needs one.
class NoopIntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return []
  }
}
vi.stubGlobal('IntersectionObserver', NoopIntersectionObserver)

// jsdom has no matchMedia; Motion reads prefers-reduced-motion through it.
vi.stubGlobal(
  'matchMedia',
  vi.fn((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
)

afterEach(() => {
  cleanup()
})
