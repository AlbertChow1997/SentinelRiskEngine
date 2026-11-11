# Frontend (`frontend/`)

The Sentinel Pay website and web app: a public marketing site, an interactive sample that runs entirely in the browser, a
signed-in product area for merchants and analysts, role-based dashboards and an internal LLM Console.

| | |
|---|---|
| **Owner** | Jiajun Xiao |
| **Stack** | React 19, TypeScript (strict), Vite, React Router, TanStack Query. UI kit: **Proposed** Tailwind CSS + shadcn/ui + Framer Motion — Jiajun decides (open question Q15) |
| **Ports** | 5173 (dev) · 3000 (Docker) |
| **Contracts** | All OpenAPI files in `contracts/`; types are generated, never hand-written |
| **Design** | `docs/DESIGN.md` §8, especially §8.8 (information architecture) |
| **Status** | Not scaffolded yet — first tickets RISK-120 (UI kit ADR) and RISK-30 (scaffold, milestone M0) |

Every page footer says: *"Portfolio project — not a real payment service."*

Working conventions for this folder are in [`CLAUDE.md`](CLAUDE.md).
