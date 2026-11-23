# Sentinel Pay — Roadmap

| | |
|---|---|
| **Status** | **Proposed.** Milestones, dates and owners below are a proposal for team sign-off (open question Q10 in `DESIGN.md` §18). Nothing here is agreed until the sign-off issue is closed |
| **Last updated** | 16 Nov 2026 |
| **Owner** | Jiawei Zhou (tech lead). Updated at every sprint planning, at least weekly, and whenever scope or dates move |
| **Related** | `docs/DESIGN.md` (what we build) · `docs/TECH_DECISIONS.md` (with what) · GitHub Project "Sentinel Pay" (backlog and sprints) |

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
| **M0** | Walking skeleton | One hello-world service and the frontend shell deployed to AWS staging through the full pipeline: Terraform, GitHub OIDC, ARM64 images in ECR, approval gate, ECS deploy, S3 + CloudFront, smoke test. Budgets alerts live | **Sun 29 Nov 2026** | Jiawei | **Reached 23 Nov 2026** (deploy run 45254610739) |
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

- The carried-over figures are the backlog estimates in `DESIGN.md` §7.11, §8.6–8.7, §9.9–9.10 and §10.11. The new-scope figures are first estimates and will be replaced by the estimates on the issues.
- **Jiawei is the critical path.** Eleven weeks of work plus the assessment period and a two-week holiday break gives mid-March.
- Zheng has the most slack. Candidates to move from Jiawei to Zheng: the Newman E2E collections, the `ml-scorer` and `llm-insights` CI workflows, and the LLM alarms.
- Availability (~12 h/week each) is an assumption until Q2 is answered.
- ADR-0017 (23 Nov 2026) adds about 14 h for Jiawei (RISK-165/166/167/170), 10–12 h for Jiajun (RISK-168) and 10–12 h for Zheng (RISK-169). Hosting work moves partly off the critical path to the teammates.

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

`RISK-<n>` is the backlog ID of an item; its GitHub issue is titled `[RISK-<n>] …`. IDs 10–98 come from design v2.0 and
IDs from 100 upwards cover the new scope. A new item takes the next free number. Status values: To do · In progress · In review · Done.

### 4.1 Jiawei Zhou — backend, gateway, infra, CI/CD

| Key | Summary | Milestone | Status |
|---|---|---|---|
| RISK-10 | Monorepo scaffold, CODEOWNERS, PR and issue templates, living docs, contracts import, `contracts.yml`, `codeql.yml` | Bootstrap | In review |
| RISK-100 | Contracts: `openapi-llm-insights-v1.yaml`, `risk.insights.v1`, JWT security on gateway and risk contracts, `POST /api/v1/merchants/me` | Bootstrap | In review; all contract drafts in PR #26; runtime auth remains RISK-111 |
| RISK-101 | GitHub Project, milestones, labels and backlog issues (Section 8); branch ruleset on `main`; GitHub Environment `staging` with required reviewer; squash merge only | Bootstrap | In progress; partial (audit 19 Nov) |
| RISK-102 | Terraform remote state, `network`, `ecr`, `github-oidc`, AWS Budgets alerts; `terraform.yml` | M0 | In progress; configuration and mock validation, no AWS apply |
| RISK-103 | `ecs-ec2-host`, `ecs-service`, `scheduler`; `aws-wake` / `aws-sleep` / `aws-status` scripts | M0 | Re-landed on `main` by RISK-106 (#83) |
| RISK-104 | `cdn` module (S3 + CloudFront + origin rules), nginx reverse proxy with the secret header | M0 | In progress; configuration and proxy tests, live CDN pending |
| RISK-105 | `deploy-staging.yml`: OIDC, ARM64 build, Trivy, ECR, approval gate, ECS deploy, S3 sync, smoke test | M0 | In progress; pipeline on `main`, first live deployment after the approved apply |
| RISK-11 (M0 subset) | Health-only backend scaffold, request IDs, JSON logs, tests and ARM64 container (#6) | M0 | In review |
| RISK-12 | Backend CI: Java 21 verify, coverage/test artifacts and Maven Dependabot (#7) | M0 | In review |
| RISK-11 (M1 remainder) | Validation, Problem Details and persistence groundwork beyond the merged M0 health scaffold | M1 | To do |
| RISK-13 … RISK-21 | Remaining Risk Engine backlog (`DESIGN.md` §7.11); M0 CI is listed separately above | M1 | To do |
| RISK-70 … RISK-84 | Gateway and event backlog (`DESIGN.md` §10.11) | M2 | To do |
| RISK-110 | `cognito` module: user pool, groups, app client, Hosted UI domain, test users | M3 | To do |
| RISK-111 | Resource-server JWT validation and role mapping in gateway and risk engine; role and tenant tests | M3 | To do |
| RISK-112 | `POST /api/v1/merchants/me`, `cognito_sub` migration, API key management endpoints | M3 | To do |
| RISK-113 | Analytics endpoints for the analyst dashboard (contract first) | M3 | To do |
| RISK-114 | `observability` module: log groups, alarms, dashboard; `pg_dump` and DLM backups | M4 | To do |
| RISK-164 | Epic: three-account staging (ADR-0017): design, docs, coordination of RISK-165 … RISK-170 | M1 | In review (design PR) |
| RISK-165 | Shared Terraform for multi-account hosts: network by AZ ID and CIDR, host role/optional data volume/optional EIP/fixed IP, `vpc-peering` module, cross-account ECR pull policies, `staging-gateway` and `staging-ml` root templates; fixed IP `10.42.1.10` and nginx upstreams on host B | M1 | To do |
| RISK-166 | Spike with Jiajun and Zheng: cross-account VPC peering and ECR pulls on the Free plan; decide peering or the public + TLS fallback | M1 | To do |
| RISK-167 | Multi-account delivery: per-account OIDC roles in `deploy-staging.yml`, wake/sleep/status across accounts, smoke checks through every host | M1 | To do |
| RISK-170 | PostgreSQL 18 service on host B: databases `sentinel`, `gateway`, `llm`, one login per service, access from hosts A and C only | M1 | To do |
| RISK-160 | Runbooks for gateway and risk engine, ORR checklist run, threat model review | M5 | To do |
| RISK-161 | Release `v1.0.0`: changelog, release notes, demo script | M5 | To do |

### 4.2 Jiajun Xiao — frontend

| Key | Summary | Milestone | Status |
|---|---|---|---|
| RISK-120 | ADR: UI kit (Tailwind CSS + shadcn/ui + Framer Motion vs MUI) | Bootstrap | Done (ADR-0010) |
| RISK-30 | Vite + React + TypeScript scaffold, lint, theme, router, app shell, `ci-frontend.yml` | M0 | Done |
| RISK-130 | Design tokens, shadcn/ui base components, ScoreBadge, Storybook with axe | M0 | Done (#25) |
| RISK-121 | Homepage: hero, product showcase, how-it-works, KPI strip, API snippet, footer disclaimer | M0–M3 | In review |
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
| RISK-168 | Staging host A (gateway) in Jiajun's own AWS account: confirm Region and plan, state bucket and budgets, `envs/staging-gateway` (network, host, ECS cluster, scheduler, OIDC deploy role), peering, Kafka service, gateway service, runbook (ADR-0017) | M1 (account, spike) · M2 (services) | To do |

### 4.3 Zheng Liu — ML scorer, LLM insights (proposed)

| Key | Summary | Milestone | Status |
|---|---|---|---|
| RISK-140 | Write `openapi-ml-scorer-v1.yaml` | Bootstrap | In review |
| RISK-50 … RISK-57 | ML scorer backlog (`DESIGN.md` §9.9) | M1 | To do |
| RISK-95 … RISK-98 | ML feedback loop (`DESIGN.md` §9.10) | M2 | To do |
| RISK-141 | `llm-insights` FastAPI scaffold, settings, health, Alembic baseline, `ci-llm.yml` | M4 | To do |
| RISK-142 | `LlmProvider`, `StubProvider`, `BedrockProvider` with stubbed boto3 tests | M4 | To do |
| RISK-143 | Versioned prompts, rendering with a field allow-list, Pydantic output validation | M4 | To do |
| RISK-144 | Kafka consumer, selection and sampling, idempotency, budget guard, persistence | M4 | To do |
| RISK-145 | Insight, invocation, stats and feedback APIs; JWT authentication and role permissions | M4 | To do |
| RISK-146 | `RiskInsightGenerated` event; scenarios L1–L4 | M4 | To do |
| RISK-163 | Model card, `llm-insights` and `ml-scorer` runbooks | M5 | To do |
| RISK-169 | Staging host C (ml) in Zheng's own AWS account: confirm Region and plan, state bucket and budgets, `envs/staging-ml` (network, host, ECS cluster, scheduler, OIDC deploy role), peering, ml-scorer service; later llm-insights task role, Bedrock model access and ml-feedback (ADR-0017) | M1 (ml-scorer) · M4 (LLM) | To do |

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
| H14 | Jiajun, Zheng → Jiawei | Accounts confirmed (eu-north-1, plan and end date), state bucket and budgets applied, account IDs shared privately | Sun 6 Dec 2026 | RISK-166 |
| H15 | Jiawei → Jiajun, Zheng | Shared modules and root templates (RISK-165) | Sun 6 Dec 2026 | RISK-168, RISK-169 Terraform |
| H16 | All | Peering and cross-account ECR pull verified, or fallback chosen (RISK-166) | Sun 13 Dec 2026 | Every cross-host dependency |
| H17 | Zheng → Jiawei | Host C runs ml-scorer, reachable from host B | Sun 3 Jan 2027 | E1–E9 on staging (H5) |
| H18 | Jiawei → Jiajun, Zheng | `gateway` and `llm` database logins on host B (RISK-170) | Sun 17 Jan 2027 | Gateway on host A; llm-insights on host C |
| H19 | Jiajun → Jiawei, Zheng | Host A runs Kafka, reachable from hosts B and C; gateway service deployable | Sun 24 Jan 2027 | H8, RISK-96, M2 |

Three-account staging (ADR-0017): RISK-166 ← RISK-165 and H14; RISK-168/169 services ← RISK-166; RISK-167 ← RISK-165;
gateway on host A ← RISK-170; llm-insights on host C ← RISK-170 and Bedrock access.

Ticket dependencies carried over from design v2.0: RISK-74 ← RISK-11/17; RISK-78 ← RISK-82; RISK-83 ← RISK-77;
RISK-91/92 ← RISK-79; RISK-96 ← RISK-77. New: RISK-111 ← RISK-100 and RISK-110; RISK-124 ← RISK-110;
RISK-144 ← RISK-82; RISK-128/129 ← RISK-145.

## 6. Progress log

| Date | Entry |
|---|---|
| 11 Nov 2026 | Repository bootstrapped on branch `chore/RISK-10-repo-bootstrap`: hygiene files, CODEOWNERS, PR and issue templates, Dependabot, `Makefile`, `docker-compose.yml` skeleton (PostgreSQL + Kafka), `contracts.yml`, `codeql.yml`, component folders with `README.md` and `CLAUDE.md`. Living documents created: `DESIGN.md` v3.0, this roadmap, `TECH_DECISIONS.md`, ADR-0001, ADR-0007, ADR-0009. The three v2.0 contracts were imported unchanged. |
| 11 Nov 2026 | Python framework settled: `ml-scorer` and `llm-insights` use FastAPI. Django was evaluated the same day and rejected (ADR-0009). |
| 11 Nov 2026 | Repository made private; Jiajun (`@jiajunxiao-work`) and Zheng (`@zliu-59`) invited as collaborators and added to CODEOWNERS. `codeql.yml` skips itself while the repository is private. |
| 11 Nov 2026 | Tracking moved from Jira to GitHub Issues and a GitHub Project; `RISK-<n>` stays as the backlog ID (Section 8). MIT licence added. |
| 11 Nov 2026 | Schedule re-planned into milestones M0–M5 (this document). Old dates (29 Nov, 13 Dec) withdrawn. Awaiting team sign-off. |
| 13 Nov 2026 | `contracts/openapi-ml-scorer-v1.yaml` written (RISK-140): `POST /v1/score`, `GET /v1/model-info`, `GET /health`. Q16 closed. Freezes at H1 (Tue 1 Dec). |
| 23 Nov 2026 | **Staging moves to three hosts in three accounts (ADR-0017).** Host B (engine, Jiawei) stays; host A (gateway + Kafka) is configured by Jiajun and host C (ML + LLM) by Zheng, each in their own AWS account in eu-north-1, joined by VPC peering (spike RISK-166 first). Images stay in account B's ECR; one pipeline assumes a role per account. LLM: Bedrock with a task role, Claude Haiku 5.5 via the `eu.` profile (Q19 closed). New items RISK-164 … RISK-170; hand-offs H14–H19. All dates Proposed. |
| 23 Nov 2026 | **M0 walking skeleton reached.** Deploy run 45254610739 (approved by Zheng) published risk-engine and nginx to the ECS host and the frontend to S3/CloudFront; smoke and independent checks pass (`/` 200, `/api/health` UP via CloudFront, origin closed to direct access). Four first-deploy fixes: #89 OIDC immutable subject, #90 DescribeTaskDefinition on `*`, #91 wait for rollout completion, #92 nginx map hash size. Repository made public for the environment reviewer gate (Q21). |
| 23 Nov 2026 | First apply: bootstrap (state bucket, budget alerts) done; staging stopped at 55/64 because the Free plan refuses t4g.medium. Host set to t4g.small for M0 (ADR-0016); the full stack needs the Paid plan or an x86 type before M1 (RISK-108). |
| 23 Nov 2026 | RISK-106 re-lands the RISK-103 ECS platform from `main` with the #30 review fixes; #29's foundation fixes go first in a separate PR. Development schedule set to every day 19:00-02:00 Europe/Dublin; RISK-117 (#80, M5) restores the daytime demo window. |
| 23 Nov 2026 | AWS project is locked to eu-north-1: staging moves there (ADR-0015, RISK-107). Project is on the Free plan with a USD 100 credit; Bedrock cross-Region access and DLM snapshots are open (RISK-108). RISK-103 code found stranded off `main` (RISK-106). |
| 16 Nov 2026 | Owner confirmed PostgreSQL 18 across environments; corrected Compose volume layout and major-version policy. RISK-11 M0 backend scaffold implemented and validated (9 tests, Java 21 ARM64 image); awaiting teammate review. Spring Boot 4.1.2 / Java 21 recorded in ADR-0008; Q18 closed. RISK-12 remains the follow-up CI ticket. |

## 7. Risks to the schedule

Readiness audit (19 Nov 2026): RISK-100 contracts remain incomplete; RISK-101 has partial setup and unverified automation.
See [the acceptance-criteria audit](reviews/2026-11-19-bootstrap-readiness.md). Neither issue is ready to close.

| Risk | Likelihood | Effect on dates | Mitigation |
|---|---|---|---|
| Jiawei is on the critical path for M0, M1, M2 and half of M3 | High | Every slip moves all later milestones | Hand E2E collections, Python CI and LLM alarms to Zheng; keep Should items optional; weekly re-plan |
| A Free-plan credit runs out or an account reaches its six-month limit (account B: 23 May 2027), or Bedrock is blocked on the Free plan | Medium | M4 LLM staging and M5 demo depend on upgrade decisions | Cost is split over three accounts (ADR-0017); budget alerts in every account; Nova Lite fallback for Bedrock; decide any irreversible upgrade explicitly |
| December assessments reduce capacity more than assumed (Q7) | Medium | M1 slips by 1–2 weeks | S4–S5 are already planned at reduced capacity; the holiday weeks are unplanned buffer |
| AWS account setup, Bedrock model access or GitHub OIDC takes longer than a sprint | Medium | M0 slips; M4 staging step slips | Start account setup and the model-access request in S0; everything else works locally with `StubProvider` |
| First Terraform apply reveals cost or quota surprises | Low | M0 slips by days | Budgets alerts in the first apply; `terraform plan` reviewed in PR |
| A 2 GiB host cannot hold its containers (host A, ~1.7 GiB, is tightest) | Medium | M2 work to rebalance | Memory limits from day one; lower Kafka's heap; upgrade that account if needed and record it here |
| Cross-account peering or ECR pulls are blocked on the Free plan | Medium | M1/M2 staging integration slips 1–2 weeks | RISK-166 spike before anything depends on it; public + TLS fallback (`DESIGN.md` §19.8) |
| A teammate's account is in another Region, on an unsuitable plan, or unavailable | Low–medium | That host's milestone slips | Step 0 of RISK-168/169 checks it first; the host can be rebuilt from Terraform in another account |
| First Terraform/ECS work for Jiajun and Zheng takes longer than estimated (~10–12 h each) | Medium | M2 (host A) or M1 (host C) slips | Root templates and a step-by-step checklist in RISK-165/168/169; pairing sessions with Jiawei; local work continues on `docker compose` |
| Frontend scope (website + app + console ≈ 100 h) exceeds one person's capacity | Medium | M3 or M4 slips | `/docs` and prompt comparison are Could; `/pricing` and `/about` are small and can move after M3 |
| Private repository on a plan without rulesets, required code-owner review or environment reviewers | Medium | No date impact, but the review and approval gates become convention rather than enforcement | Check Q21; deployment fails closed and deploy credentials default off until a real gate or separately approved equivalent exists |
| Contract changes after a freeze | Medium | Rework in two components | Freeze points H1, H6, H11; additive-only rule; `oasdiff` in CI |

## 8. Tracking setup: GitHub Issues + GitHub Project (tech lead)

The team uses GitHub only; Jira from design v2.0 was dropped on 11 Nov 2026 (`TECH_DECISIONS.md` D17).

1. **Project:** create one GitHub Project named "Sentinel Pay", linked to this repository. Give Jiajun and Zheng write access to it.
2. **Fields:** *Status* (To do → In progress → In review → Done), *Iteration* (one week, Monday start, matching Section 3), *Estimate* (number, hours).
3. **Views:** a board grouped by Status for the current iteration; a table grouped by milestone; one filtered view per assignee.
4. **Milestones:** `M0` … `M5` with the target dates of Section 2. Every backlog issue has a milestone.
5. **Labels:** type — `task`, `bug`, `question`, `decision-needed`, `blocked`; component — `backend`, `gateway`, `frontend`, `ml`, `llm`, `infra`, `contracts`, `docs`.
6. **Issues:** one per backlog item in Section 4 and in the `DESIGN.md` backlog tables, titled `[RISK-<n>] <summary>`, created with the *Task* template. Create the items of the current and next milestone first; later ones can wait.
7. **Dependencies:** write "Blocked by #<n>" in the issue body and add the `blocked` label while it applies.
8. **Automation:** enable the built-in project workflows — new issues go to "To do", a PR that says `Closes #<n>` moves the card to "In review", and merging it closes the issue and moves the card to "Done".
