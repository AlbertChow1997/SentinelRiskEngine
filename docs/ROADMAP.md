# Sentinel Pay — Roadmap

| | |
|---|---|
| **Status** | **Proposed.** Milestones, dates and owners below are a proposal for team sign-off (open question Q10 in `DESIGN.md` §18). Nothing here is agreed until the sign-off issue is closed |
| **Last updated** | 11 Nov 2026 |
| **Owner** | Jiawei Zhou (tech lead). Updated at every sprint planning, at least weekly, and whenever scope or dates move |
| **Related** | `docs/DESIGN.md` (what we build) · `docs/TECH_DECISIONS.md` (with what) · Jira project `RISK` (backlog and sprints) |

## 1. Why the schedule changed

Design v2.0 planned two releases in four weeks: the Risk Engine on 29 Nov 2026 and the Sentinel Pay platform on 13 Dec 2026.
Since then the scope has grown by a public website, authentication and roles, an LLM insight step with a developer console, an
AWS staging environment and a full CI/CD pipeline. **The old dates no longer hold.**

The plan now has six milestones. The first one ships the pipeline, not a feature: a walking skeleton deployed to AWS through
the real CI/CD path, so every later milestone is delivered the same way it will be released.

## 2. Milestones

| # | Milestone | Outcome (definition of reached) | Target date | Owner | Status |
|---|---|---|---|---|---|
| — | Bootstrap | Repository skeleton, living documents, contracts imported, contract and CodeQL workflows | Sun 15 Nov 2026 | Jiawei | In review |
| **M0** | Walking skeleton | One hello-world service and the frontend shell deployed to AWS staging through the full pipeline: Terraform, GitHub OIDC, ARM64 images in ECR, approval gate, ECS deploy, S3 + CloudFront, smoke test. Budgets alerts live | **Sun 29 Nov 2026** | Jiawei | Proposed |
| **M1** | Risk engine + ML | Risk Engine scope of `DESIGN.md` §7 and ML scorer scope of §9; analyst app pages on mocks then on the real API; scenarios E1–E9 pass | **Sun 10 Jan 2027** | Jiawei, Zheng, Jiajun | Proposed |
| **M2** | Gateway + Kafka | Payment Gateway scope of §10, events and outbox of §11, risk-engine event changes of §7.12; scenarios P1–P14 pass | **Sun 7 Feb 2027** | Jiawei | Proposed |
| **M3** | Website, auth and dashboards | Public site (`/`, `/sample`, `/pricing`, `/about`), Cognito login and roles, `/product`, role-based `/dashboard`, JWT on ops and analytics endpoints, merchant provisioning | **Sun 21 Feb 2027** | Jiajun, Jiawei | Proposed |
| **M4** | LLM insights + console | `llm-insights` service, `risk.insights.v1`, AI summary in the review flow, LLM Console; scenarios L1–L4 pass | **Sun 7 Mar 2027** | Zheng (proposed), Jiajun | Proposed |
| **M5** | Hardening, ORR, release v1.0 | Runbooks, alarms and dashboard, threat model, ORR checklist passed, demo rehearsed, tag `v1.0.0` | **Sun 21 Mar 2027** | Jiawei, all | Proposed |

Milestones are **integration checkpoints**, not the only time work happens. The frontend and ML tracks start in Sprint 1 and run
in parallel with the backend (Section 3).

### How the dates were estimated

| Person | Carried over from design v2.0 | New scope (rough estimate) | Total | Weeks at ~12 h/week |
|---|---|---|---|---|
| Jiawei | Risk Engine 26 h + Gateway and events 35 h | Infra and CI/CD ~30 h, Cognito and JWT in two services ~14 h, remaining Terraform modules ~12 h, hardening and ORR ~14 h | ≈ 131 h | ≈ 11 |
| Jiajun | Analyst UI 23 h + payments UI 11 h | Website ~30 h, auth, product area and dashboards ~25 h, LLM Console ~12 h | ≈ 101 h | ≈ 8.5 |
| Zheng | ML scorer 20 h + feedback loop 8 h | LLM Insights ~35 h | ≈ 63 h | ≈ 5.5 |

- The carried-over figures are the backlog estimates in `DESIGN.md` §7.11, §8.6–8.7, §9.9–9.10 and §10.11. The new-scope figures are first estimates and will be replaced by ticket estimates in Jira.
- **Jiawei is the critical path.** Eleven weeks of work plus the assessment period and a two-week holiday break gives mid-March.
- Zheng has the most slack. Candidates to move from Jiawei to Zheng: the Newman E2E collections, the `ml-scorer` and `llm-insights` CI workflows, and the LLM alarms.
- Availability (~12 h/week each) is an assumption until Q2 is answered.

## 3. Sprint plan (one-week sprints, Monday–Sunday)

| Sprint | Dates | Jiawei | Jiajun | Zheng | Checkpoint |
|---|---|---|---|---|---|
| S0 | Wed 11 – Sun 15 Nov 2026 | Repository bootstrap, living docs, sign-off issues | Read `DESIGN.md` §8; UI kit decision (ADR) | Read `DESIGN.md` §9 and §13; write the ML contract | Bootstrap PR merged |
| S1 | 16 – 22 Nov | Terraform state, `network`, `ecr`, `github-oidc`, Budgets; hello-world service | Frontend scaffold, design tokens, navigation shell | `ml-scorer` FastAPI scaffold, ML contract draft | |
| S2 | 23 – 29 Nov | `ecs-ec2-host`, `scheduler`, `cdn`, `deploy-staging.yml`, smoke test | Homepage; shell deployed to S3 + CloudFront | Synthetic data generator | **M0 · H0** |
| S3 | 30 Nov – 6 Dec | Risk Engine skeleton, schema, repositories | `/sample` on bundled mock data | Shared feature module | H1 (Tue 1 Dec) |
| S4 | 7 – 13 Dec | Rule engine, customer context *(reduced capacity — assessments, Q7)* | Generated API types, MSW, assessments list | Training and evaluation pipeline | H2 |
| S5 | 14 – 20 Dec | ML client, aggregator, idempotency *(reduced capacity)* | Assessment detail, review queue | `/v1/score`, explanations, Dockerfile, CI | H3 |
| — | 21 Dec 2026 – 3 Jan 2027 | **No sprint** — holidays; buffer for anything that slipped | | | |
| S6 | 4 – 10 Jan 2027 | Review API, stats, seed data, compose | Simulator, dashboard KPIs, tests | Model card, feature parity check | H4, H5 · **M1** |
| S7 | 11 – 17 Jan | Gateway skeleton, schema, state machine | `/pricing`, `/about`, accessibility pass | Persist scored features | H6 (Tue 12 Jan) |
| S8 | 18 – 24 Jan | Idempotency, risk client and fallback, acquirer | Payments list and detail on mocks | Feedback collector | H7, H8 |
| S9 | 25 – 31 Jan | Capture, cancel, refund; outbox and Kafka; risk events; `cognito` module | Demo checkout; login flow with PKCE | Retraining script; LLM contract draft | H10, H12 |
| S10 | 1 – 7 Feb | Held-payment flow, recovery jobs, ops endpoints, ledger, P1–P14 | `/product` for merchants and analysts | `llm-insights` scaffold, providers | H9 · **M2** |
| S11 | 8 – 14 Feb | JWT in gateway and risk engine, role tests, merchant provisioning | Role-based `/dashboard` (merchant) | Prompt, output validation, guardrails | H11 (Tue 9 Feb) |
| S12 | 15 – 21 Feb | Analytics endpoints, tenant scoping tests, threat model | `/dashboard` (analyst), sleeping banner, Playwright | Consumer, persistence, insight API | H13 · **M3** |
| S13 | 22 – 28 Feb | `observability` module, alarms, backups | AI summary in review flow, LLM Console table and detail | Invocation, stats and feedback APIs; event | |
| S14 | 1 – 7 Mar | LLM in staging (Bedrock access, SSM, budget alarm) | LLM Console overview | L1–L4, Bedrock adapter tests | **M4** |
| S15 | 8 – 14 Mar | Runbooks, ORR checklist, load script | Cross-browser and accessibility fixes | Model card and LLM runbook | Feature freeze (Thu 11 Mar) |
| S16 | 15 – 21 Mar | ORR, release notes, tag `v1.0.0` | Demo rehearsal | Demo rehearsal | **M5 · v1.0.0** |

Rules for cutting scope when a sprint slips: drop **Could**, then **Should** items of `DESIGN.md` §2.4 before moving a
milestone; move a milestone before cutting tests. Any move is recorded in Section 6 below.

## 4. Backlog by person

Jira keys in the 10–98 range come from design v2.0. Keys from 100 upwards are **proposed placeholders** for the new scope;
Jira assigns the real numbers when the tickets are created. Status values: To do · In progress · In review · Done.

### 4.1 Jiawei Zhou — backend, gateway, infra, CI/CD

| Key | Summary | Milestone | Status |
|---|---|---|---|
| RISK-10 | Monorepo scaffold, CODEOWNERS, PR and issue templates, living docs, contracts import, `contracts.yml`, `codeql.yml` | Bootstrap | In review |
| RISK-100 | Contracts: `openapi-llm-insights-v1.yaml`, `risk.insights.v1`, JWT security on gateway and risk contracts, `POST /api/v1/merchants/me` | Bootstrap | To do |
| RISK-101 | Branch ruleset on `main`, GitHub Environment `staging` with required reviewer, labels | Bootstrap | To do |
| RISK-102 | Terraform remote state, `network`, `ecr`, `github-oidc`, AWS Budgets alerts; `terraform.yml` | M0 | To do |
| RISK-103 | `ecs-ec2-host`, `ecs-service`, `scheduler`; `aws-wake` / `aws-sleep` / `aws-status` scripts | M0 | To do |
| RISK-104 | `cdn` module (S3 + CloudFront + origin rules), nginx reverse proxy with the secret header | M0 | To do |
| RISK-105 | `deploy-staging.yml`: OIDC, ARM64 build, Trivy, ECR, approval gate, ECS deploy, S3 sync, smoke test | M0 | To do |
| RISK-11 … RISK-21 | Risk Engine backlog (`DESIGN.md` §7.11) | M1 | To do |
| RISK-70 … RISK-84 | Gateway and event backlog (`DESIGN.md` §10.11) | M2 | To do |
| RISK-110 | `cognito` module: user pool, groups, app client, Hosted UI domain, test users | M3 | To do |
| RISK-111 | Resource-server JWT validation and role mapping in gateway and risk engine; role and tenant tests | M3 | To do |
| RISK-112 | `POST /api/v1/merchants/me`, `cognito_sub` migration, API key management endpoints | M3 | To do |
| RISK-113 | Analytics endpoints for the analyst dashboard (contract first) | M3 | To do |
| RISK-114 | `observability` module: log groups, alarms, dashboard; `pg_dump` and DLM backups | M4 | To do |
| RISK-160 | Runbooks for gateway and risk engine, ORR checklist run, threat model review | M5 | To do |
| RISK-161 | Release `v1.0.0`: changelog, release notes, demo script | M5 | To do |

### 4.2 Jiajun Xiao — frontend

| Key | Summary | Milestone | Status |
|---|---|---|---|
| RISK-120 | ADR: UI kit (Tailwind CSS + shadcn/ui + Framer Motion vs MUI) | Bootstrap | To do |
| RISK-30 | Vite + React + TypeScript scaffold, lint, theme, router, app shell, `ci-frontend.yml` | M0 | To do |
| RISK-121 | Homepage: hero, product showcase, how-it-works, KPI strip, API snippet, footer disclaimer | M0–M3 | To do |
| RISK-122 | `/sample`: scenario player on a bundled mock dataset | M3 | To do |
| RISK-31 … RISK-38 | Analyst app pages (`DESIGN.md` §8.6), mapped onto the new routes | M1 | To do |
| RISK-90 … RISK-94 | Payments UI (`DESIGN.md` §8.7) | M2 | To do |
| RISK-123 | `/pricing` (tiers, fee calculator, FAQ) and `/about` | M3 | To do |
| RISK-124 | Login and sign-up with PKCE, protected routes, `returnTo`, avatar menu | M3 | To do |
| RISK-125 | `/product`: merchant area (payments, API keys) and analyst area (review queue) | M3 | To do |
| RISK-126 | Role-based `/dashboard`: merchant and analytics variants | M3 | To do |
| RISK-127 | Sleeping-environment banner; Playwright smoke suite | M3 | To do |
| RISK-128 | AI summary panel with feedback in the review flow | M4 | To do |
| RISK-129 | LLM Console: overview, invocations table, invocation detail | M4 | To do |
| RISK-162 | Accessibility (WCAG 2.1 AA) and cross-browser pass | M5 | To do |

### 4.3 Zheng Liu — ML scorer, LLM insights (proposed)

| Key | Summary | Milestone | Status |
|---|---|---|---|
| RISK-140 | Write `openapi-ml-scorer-v1.yaml` | Bootstrap | To do |
| RISK-50 … RISK-57 | ML scorer backlog (`DESIGN.md` §9.9) | M1 | To do |
| RISK-95 … RISK-98 | ML feedback loop (`DESIGN.md` §9.10) | M2 | To do |
| RISK-141 | `llm-insights` FastAPI scaffold, settings, health, Alembic baseline, `ci-llm.yml` | M4 | To do |
| RISK-142 | `LlmProvider`, `StubProvider`, `BedrockProvider` with stubbed boto3 tests | M4 | To do |
| RISK-143 | Versioned prompts, rendering with a field allow-list, Pydantic output validation | M4 | To do |
| RISK-144 | Kafka consumer, selection and sampling, idempotency, budget guard, persistence | M4 | To do |
| RISK-145 | Insight, invocation, stats and feedback APIs; JWT authentication and role permissions | M4 | To do |
| RISK-146 | `RiskInsightGenerated` event; scenarios L1–L4 | M4 | To do |
| RISK-163 | Model card, `llm-insights` and `ml-scorer` runbooks | M5 | To do |

## 5. Dependencies and hand-offs

Definitions are in `DESIGN.md` §3.2. All dates are **Proposed**.

| # | From → To | What | Needed by | Blocks |
|---|---|---|---|---|
| H0 | Jiawei → All | Walking skeleton deploys through the pipeline | Sun 29 Nov 2026 | Every later deploy |
| H1 | All | Risk Engine + ML contracts frozen | Tue 1 Dec 2026 | Typed clients, WireMock and MSW stubs |
| H2 | Zheng → Jiawei | ML scorer image with a trained model | Sun 13 Dec 2026 | RISK-16 |
| H3 | Jiawei → Jiajun | Risk Engine in compose with seed data | Sun 20 Dec 2026 | Frontend integration |
| H4 | Jiawei → Zheng | Real customer-context values | Tue 5 Jan 2027 | Feature parity check |
| H5 | All | E1–E9 pass | Sat 9 Jan 2027 | M1 |
| H6 | All | Gateway API + event contract frozen | Tue 12 Jan 2027 | RISK-90, RISK-96 |
| H7 | Jiawei → Jiajun | Gateway in compose with seed merchants | Sun 24 Jan 2027 | RISK-91 … 93 |
| H8 | Jiawei → Zheng | `payments.events.v1` carrying real events | Sun 24 Jan 2027 | RISK-96 |
| H10 | Jiawei → Jiajun | Cognito pool, app client, one test user per role | Sun 31 Jan 2027 | RISK-124 |
| H12 | Jiawei → Zheng | `risk.assessments.v1` carrying real events; Bedrock model access enabled | Sun 31 Jan 2027 | RISK-144 |
| H9 | All | P1–P14 pass | Sat 6 Feb 2027 | M2 |
| H11 | All | LLM Insights API + `risk.insights.v1` frozen | Tue 9 Feb 2027 | RISK-128, RISK-129 |
| H13 | Zheng → Jiajun | `llm-insights` in compose with `StubProvider` | Sun 21 Feb 2027 | Console integration |

Ticket dependencies carried over from design v2.0: RISK-74 ← RISK-11/17; RISK-78 ← RISK-82; RISK-83 ← RISK-77;
RISK-91/92 ← RISK-79; RISK-96 ← RISK-77. New: RISK-111 ← RISK-100 and RISK-110; RISK-124 ← RISK-110;
RISK-144 ← RISK-82; RISK-128/129 ← RISK-145.

## 6. Progress log

| Date | Entry |
|---|---|
| 11 Nov 2026 | Repository bootstrapped on branch `chore/RISK-10-repo-bootstrap`: hygiene files, CODEOWNERS, PR and issue templates, Dependabot, `Makefile`, `docker-compose.yml` skeleton (PostgreSQL + Kafka), `contracts.yml`, `codeql.yml`, component folders with `README.md` and `CLAUDE.md`. Living documents created: `DESIGN.md` v3.0, this roadmap, `TECH_DECISIONS.md`, ADR-0001, ADR-0007, ADR-0009. The three v2.0 contracts were imported unchanged. |
| 11 Nov 2026 | Python framework settled: `ml-scorer` and `llm-insights` use FastAPI. Django was evaluated the same day and rejected (ADR-0009). |
| 11 Nov 2026 | Repository made private; Jiajun (`@jiajunxiao-work`) and Zheng (`@zliu-59`) invited as collaborators and added to CODEOWNERS. `codeql.yml` skips itself while the repository is private. |
| 11 Nov 2026 | Schedule re-planned into milestones M0–M5 (this document). Old dates (29 Nov, 13 Dec) withdrawn. Awaiting team sign-off. |

## 7. Risks to the schedule

| Risk | Likelihood | Effect on dates | Mitigation |
|---|---|---|---|
| Jiawei is on the critical path for M0, M1, M2 and half of M3 | High | Every slip moves all later milestones | Hand E2E collections, Python CI and LLM alarms to Zheng; keep Should items optional; weekly re-plan |
| December assessments reduce capacity more than assumed (Q7) | Medium | M1 slips by 1–2 weeks | S4–S5 are already planned at reduced capacity; the holiday weeks are unplanned buffer |
| AWS account setup, Bedrock model access or GitHub OIDC takes longer than a sprint | Medium | M0 slips; M4 staging step slips | Start account setup and the model-access request in S0; everything else works locally with `StubProvider` |
| First Terraform apply reveals cost or quota surprises | Low | M0 slips by days | Budgets alerts in the first apply; `terraform plan` reviewed in PR |
| 4 GB host cannot hold all containers | Medium | M4 or M5 work to resize | Memory limits from day one; move to t4g.large and record it here |
| Frontend scope (website + app + console ≈ 100 h) exceeds one person's capacity | Medium | M3 or M4 slips | `/docs` and prompt comparison are Could; `/pricing` and `/about` are small and can move after M3 |
| Private repository on a plan without rulesets, required code-owner review or environment reviewers | Medium | No date impact, but the review and approval gates become convention rather than enforcement | Check the plan (Q21); if unavailable, enforce by team agreement and revisit before M0 |
| Contract changes after a freeze | Medium | Rework in two components | Freeze points H1, H6, H11; additive-only rule; `oasdiff` in CI |

## 8. Jira setup (tech lead)

1. **Invite** Jiajun and Zheng (Jira Cloud Free: up to 10 users). Consider renaming the project to "Sentinel Pay"; the key `RISK` stays.
2. **Components:** `Backend`, `Gateway`, `Frontend`, `ML`, `LLM`, `Infra`, `Docs`.
3. **Epics:** `Platform & CI/CD` (M0), `Risk Engine` and `ML Scorer` and `Analyst UI` (M1), `Payment Gateway` and `Event Integration (Kafka)` and `Payments UI` and `ML Feedback Loop` (M2), `Website` and `Authentication & Roles` and `Dashboards` (M3), `LLM Insights` and `LLM Console` (M4), `Hardening & Release` (M5).
4. **Versions:** one Jira version per milestone (`M0` … `M5`), plus `v1.0.0` on the M5 date. Set *Fix version* on every work item.
5. **Work items:** from Section 4 and the backlog tables in `DESIGN.md`. Keys there are suggestions.
6. **Sprints:** as in Section 3.
7. **Board:** `To Do → In Progress → In Review → Done`; quick filters per assignee and per component.
8. **GitHub for Jira:** branches, commits and PRs that contain `RISK-n` appear on the ticket. GitHub issues carry the Jira key in the title, and the Jira ticket links back to the issue.
