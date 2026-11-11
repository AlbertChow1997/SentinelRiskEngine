# CLAUDE.md — Frontend (`frontend/`)

Read the root `CLAUDE.md` first; this file only adds what is specific to this folder.
Owner: Jiajun Xiao. Design: `docs/DESIGN.md` §8 (§8.8 takes precedence for routes). Root `CLAUDE.md` §5 holds the same information architecture.

**This folder belongs to Jiajun.** Change it only when the user explicitly asks, and always through a PR that Jiajun reviews.

## Status

Not scaffolded yet. The UI kit decision (ADR-0010) comes before the first UI PR. The commands below are the target once RISK-30 lands.

## Stack

- React 19, TypeScript strict, Vite, React Router, TanStack Query.
- API types generated from `contracts/` with `openapi-typescript`; calls through `openapi-fetch`.
- React Hook Form + Zod, MSW for mocks, Recharts for charts.
- Auth: `react-oidc-context` / `oidc-client-ts`, Authorization Code + PKCE against Cognito.
- Vitest + React Testing Library; Playwright for end-to-end UI tests; ESLint + Prettier.
- **Check React 19, Vite and router APIs against official docs or `package.json`.** AI tools often produce older React patterns.

## Commands

```bash
npm ci
npm run dev                  # http://localhost:5173, proxies /api to the local services
npm run lint
npm run typecheck
npm test -- --run            # Vitest
npm run build
npm run generate:api         # regenerate types from ../contracts/*.yaml
npx playwright test          # UI smoke tests against the preview build
```

## Conventions

- **No `any`.** API types come only from the generated schema files; never write a duplicate type by hand.
- Server state lives in TanStack Query. Keep components small and testable.
- **Tokens stay in memory.** Never put a token in `localStorage` or `sessionStorage`.
- Role-based rendering is a convenience; the backend enforces access. Handle 401 (re-login), 403 and 404 explicitly.
- `/sample` runs fully client-side on a bundled mock dataset. It must never call the backend.
- AI summaries are always labelled *"AI-generated, advisory"*. A missing summary is a normal state, not an error.
- When `/api/health` does not answer within a short timeout, show the "Demo environment is sleeping" banner instead of error screens.
- Money: format with `Intl.NumberFormat` in the transaction currency; never do arithmetic on amounts in the UI.
- Times: local time on screen, UTC in a tooltip.
- Score bands match the backend: 0–39 Low (green), 40–69 Medium (amber), 70–100 High (red). Always show the text label as well as the colour.
- Accessibility target is WCAG 2.1 AA: keyboard navigation, contrast, alt text, `prefers-reduced-motion`.
- The visual style is *inspired by* modern fintech marketing sites. **Do not copy any third party's logo, wordmark, illustrations, copy, exact gradients or code.** Brand: "Sentinel Pay".
- Footer on every page: *"Portfolio project — not a real payment service."* Pricing is labelled as demo pricing.
- Never commit a real key. `.env.example` holds placeholders.

## Tests

- Component tests for score bands, breakdowns with a null ML score, and form validation.
- Page tests with MSW: filters build the right query string; review refreshes the queue; API validation errors appear next to fields.
- Playwright: homepage, sample flow, login redirect, role-based dashboard.
