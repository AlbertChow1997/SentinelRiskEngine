export interface NavItem {
  to: string
  label: string
}

// Top navigation from DESIGN.md §8.8.2. "Dashboard" joins this list once sign-in exists (RISK-124).
export const primaryNav: readonly NavItem[] = [
  { to: '/product', label: 'Product' },
  { to: '/sample', label: 'Sample' },
  { to: '/about', label: 'About us' },
  { to: '/pricing', label: 'Pricing' },
]
