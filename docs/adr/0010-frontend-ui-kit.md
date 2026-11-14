# ADR-0010: Use Tailwind CSS and shadcn/ui with our own design tokens for the frontend

| | |
|---|---|
| **Status** | Accepted |
| **Date** | 14 Nov 2026 |
| **Deciders** | Jiajun Xiao (owner of `frontend/`); Jiawei Zhou (tech lead) informed |
| **Related** | RISK-120 (GitHub issue #12) · blocks RISK-30 (#13) · `TECH_DECISIONS.md` D09 · `DESIGN.md` §8.1, §8.8 · closes Q15 |

## Context

The frontend has two parts with different needs (`DESIGN.md` §8.8):

- A **public website** (`/`, `/sample`, `/pricing`, `/about`): a fintech marketing look with a large hero, custom layout,
  our own brand "Sentinel Pay", and subtle scroll and step animations. It must not look like any third party's site or a stock
  component library.
- A **signed-in app area** (`/product`, `/dashboard`, `/internal/llm`): data-heavy pages with server-side paged, filtered and
  sorted tables, charts, forms, dialogs and status chips.

Constraints:

- One owner (Jiajun) builds both parts, so one styling approach and one set of components is cheaper than two.
- Accessibility target: WCAG 2.1 AA — keyboard navigation, visible focus, contrast, `prefers-reduced-motion`. Status is never shown
  by colour alone (`DESIGN.md` §8.3).
- The site is a static SPA on S3 + CloudFront (ADR-0007), so the kit must work with plain Vite and no server rendering.
- Design v2.0 chose MUI + MUI X DataGrid for the analyst UI, before the public website was in scope.
- The project is also a portfolio piece aimed at frontend roles in Ireland. The target job descriptions ask for React +
  TypeScript, design systems and component libraries, accessibility, testing and CI/CD, and LLM-facing UI. A reusable,
  documented component library with its own design tokens and automated accessibility checks is part of what the frontend
  should demonstrate.

## Options

1. **Tailwind CSS + shadcn/ui (Radix primitives) + Motion, with TanStack Table and Recharts in the app area.**
   shadcn/ui components are copied into the repository and edited freely; Radix supplies accessible behaviour (focus management,
   keyboard handling, ARIA) for dialogs, menus, popovers and tabs. Styling comes from our own design tokens.
   *Pros:* full control over the look, so the marketing site and the app share one visual language; accessible primitives;
   small bundle (only the components we use); current and widely used.
   *Cons:* tables and complex forms need more assembly; we own and maintain the copied component code.
2. **MUI + MUI X DataGrid (design v2.0 choice).**
   *Pros:* the fastest path to data tables and forms; mature and well documented.
   *Cons:* the result looks recognisably like Material Design and is hard to turn into a distinctive marketing site; theming
   fights the defaults; a larger runtime (CSS-in-JS).
3. **Split: Tailwind for the public site, MUI for the app area.**
   *Pros:* each part gets the best fit.
   *Cons:* two styling systems, two sets of tokens and two component vocabularies for one owner; the product looks inconsistent
   between the site and the app.

## Decision

We use **option 1** for both the public website and the app area:

- **Tailwind CSS v4** for styling. Our **design tokens** (colour, typography, spacing, radius, shadow, motion) are CSS variables
  defined once in Tailwind's theme and consumed by every component. Light and dark themes switch the token values, not the
  components.
- **shadcn/ui** as the starting point for components, built on **Radix** primitives, copied into `frontend/src/components/ui/`
  and restyled with our tokens.
- **Motion** (the library formerly called Framer Motion) for hero, scroll and `/sample` step animations. Every animation respects
  `prefers-reduced-motion`.
- **TanStack Table** (with TanStack Virtual for long lists) for app-area tables with server-side paging, filtering and sorting.
- **Recharts** for charts, as already listed in `DESIGN.md` §8.1.
- **Storybook** is the catalogue of the component library: every shared component has stories for its states (default, loading,
  empty, error, disabled), and an **axe** accessibility check runs on the stories and in the Playwright tests.

Main reasons: one token-driven component library gives the public site a distinctive brand and gives the app area accessible,
consistent building blocks, without the Material look and without two styling systems. It also maps directly onto what the
target roles ask for: a design system with tokens, a documented component library (Storybook), accessibility checked by
tooling (Radix + axe), and tests in CI. Library versions are not fixed here;
they are pinned in the scaffold PR (RISK-30) after checking the current official documentation.

## Consequences

- The marketing site and the app share one look and one set of components; a brand change is a token change.
- We build the data-table wrapper (paging, sorting, filter bar, column visibility) ourselves on TanStack Table instead of getting it
  from DataGrid. This costs a few hours in RISK-33 and is accepted.
- We own the copied shadcn/ui code. Updates from upstream are pulled deliberately, not by a dependency bump.
- Storybook and axe add two dev dependencies and one CI step; Dependabot's npm block covers them.
- MUI and MUI X are not used. References to "DataGrid" in `DESIGN.md` §8.2 and §8.7 mean "a server-side paged table" built
  on TanStack Table.
- RISK-30 sets up Tailwind, the token file, the first shadcn/ui components and the app shell; Storybook can follow in its own PR.

**Revisit when** the app-area tables need features that would take substantially longer to build on TanStack Table than to get
from a ready-made data grid (review at M3).
