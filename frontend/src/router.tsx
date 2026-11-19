import type { RouteObject } from 'react-router'
import { SiteLayout } from '@/layout/SiteLayout'
import { HomePage } from '@/pages/home/HomePage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { PlaceholderPage } from '@/pages/PlaceholderPage'
import { RouteErrorPage } from '@/pages/RouteErrorPage'

// Routes follow DESIGN.md §8.8.2. Placeholders are replaced by their own tickets.
export const routes: RouteObject[] = [
  {
    element: <SiteLayout />,
    errorElement: <RouteErrorPage />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'sample', element: <PlaceholderPage title="Interactive sample" ticket="RISK-122" /> },
      { path: 'about', element: <PlaceholderPage title="About us" ticket="RISK-123" /> },
      { path: 'pricing', element: <PlaceholderPage title="Pricing" ticket="RISK-123" /> },
      { path: 'product', element: <PlaceholderPage title="Product" ticket="RISK-125" /> },
      { path: 'login', element: <PlaceholderPage title="Log in" ticket="RISK-124" /> },
      { path: 'signup', element: <PlaceholderPage title="Sign up" ticket="RISK-124" /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]
