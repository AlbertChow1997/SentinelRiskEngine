# Frontend (`frontend/`)

The Sentinel Pay website and web app: a public marketing site, an interactive sample that runs entirely in the browser, a
signed-in product area for merchants and analysts, role-based dashboards and an internal LLM Console.

| | |
|---|---|
| **Owner** | Jiajun Xiao (@jiajunxiao-work) |
| **Stack** | React 19, TypeScript (strict), Vite, React Router, TanStack Query. UI kit: Tailwind CSS v4 + shadcn/ui with our own design tokens, Storybook ([ADR-0010](../docs/adr/0010-frontend-ui-kit.md)) |
| **Ports** | 5173 (dev) · 3000 (Docker) |
| **Contracts** | All OpenAPI files in `contracts/`; types are generated, never hand-written |
| **Design** | `docs/DESIGN.md` §8, especially §8.8 (information architecture) |
| **Status** | Scaffolded (RISK-30): site shell, routing, design tokens, tests and CI. Pages land in RISK-121 onwards |

Every page footer says: *"Portfolio project — not a real payment service."*

## Quick start

```bash
npm ci
npm run dev          # http://localhost:5173, proxies /api to the risk engine on :8081
npm test -- --run    # Vitest + React Testing Library
npm run build        # type-check and production build into dist/
npm run storybook    # component catalogue with the a11y panel, http://localhost:6006
npm run test:e2e     # Playwright + axe on the built site and every story (build both first)
```

Working conventions for this folder are in [`CLAUDE.md`](CLAUDE.md).
