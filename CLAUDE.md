# CLAUDE.md — Sentinel Pay

Instructions for Claude Code working in this repository. Read this file at the start of every session.
If something here conflicts with `docs/DESIGN.md`, **ask the user**. Don't guess.

---

## 1. Project snapshot

**Sentinel Pay** is a three-person portfolio project that simulates an enterprise fintech product: a **payment gateway** with a **real-time risk engine** (rules + ML), an **LLM insight step**, and a **public website and web app**. It is built and run the way an Amazon or Microsoft team would: design docs, small reviewed PRs, CI/CD, infrastructure as code, and operational readiness.

| Person | GitHub | Owns |
|---|---|---|
| Jiawei Zhou | @AlbertChow1997 | Tech lead · `backend/` (risk engine) · `payment-gateway/` · `infra/` · CI/CD · releases |
| Jiajun Xiao | @jiajunxiao-work | `frontend/` (website + web app) · staging host A (gateway) in their own AWS account, `infra/terraform/envs/staging-gateway/` |
| Zheng Liu | @zliu-59 | `ml-scorer/` · proposed owner of `llm-insights/` (confirm via issue) · staging host C (ml) in their own AWS account, `infra/terraform/envs/staging-ml/` |

The user you are talking to is usually **Jiawei Zhou**. Only change another owner's area when the user explicitly asks. Even then, the change goes through a PR that owner reviews.

**Sources of truth.** Read the relevant one before changing behaviour:

- `docs/DESIGN.md`: architecture and behaviour
- `docs/ROADMAP.md`: schedule, milestones and progress
- `docs/TECH_DECISIONS.md`: technology choices, trade-offs and ADR index
- `contracts/`: API and event contracts (OpenAPI 3.1 / AsyncAPI 3.0)

---

## 2. Golden rules (always follow)

1. **English only** in everything committed to GitHub: code, comments, docs, commit messages, PRs, issues. The user may talk to you in Chinese; reply in Chinese but write repo content in English.
2. **Contracts first.** Change `contracts/*.yaml` before code that depends on it. Changes to a frozen contract must be additive. A breaking change needs a new version and an ADR.
3. **Never commit secrets.** That includes keys, passwords, tokens, `.env` files and AWS account IDs in plain text. Use `.env.example` with placeholders, AWS SSM Parameter Store / Secrets Manager, and GitHub OIDC (no long-lived AWS keys anywhere).
4. **No real payment data.** Never accept or store card numbers (PAN). Cards are test tokens. IDs are pseudonymous. LLM prompts carry no personal data.
5. **The LLM is advisory only.** It never approves, declines or changes a payment or risk decision. The workflow must behave identically if the LLM step is down.
6. **Small, reviewable changes.** One issue → one branch → one PR, ideally under 400 changed lines. Don't mix refactors with features.
7. **Tests with every change.** No PR without tests for new behaviour. Run the component's checks locally before saying a task is done.
8. **Docs move with code.** If behaviour, architecture, schedule or a technology choice changes, update `DESIGN.md`, `ROADMAP.md` or `TECH_DECISIONS.md` in the same PR.
9. **Unclear or blocked? Raise a GitHub issue; don't guess.** Draft the issue (template in §9.4), show it to the user, and create it with `gh issue create` only after the user confirms.
10. **Verify versions.** Don't rely on memory for library APIs, especially Spring Boot 4, Spring Kafka, React 19, Terraform AWS provider and Bedrock SDKs. Check official docs or the versions already in the build files. When unsure, say so.
11. **Ask before anything irreversible or costly:** `terraform apply`, deleting AWS resources, force-pushing, rewriting history, changing branch protection, or anything that incurs AWS charges.
12. **Write a local explanation for every change.** Before handoff, create or update a numbered Chinese note in the git-ignored `local-notes/` directory and update its index. Follow `AGENTS.md` and `local-notes/README.md`; record actual implementation, validation, limitations and next steps. This also applies to reviews, merges, configuration and documentation updates. Never force-add local notes to GitHub; they supplement the English project docs.

---

## 3. Repository map

```text
sentinel-pay/
├── CLAUDE.md                     # this file
├── backend/                      # Risk Engine — Java 21, Spring Boot 4, Maven
├── payment-gateway/              # Payment Gateway — Java 21, Spring Boot 4, Spring Kafka
├── ml-scorer/                    # ML scoring — Python 3.12, FastAPI, scikit-learn, uv
├── llm-insights/                 # LLM insight service — Python 3.12, FastAPI, boto3 (Bedrock)   [new]
├── frontend/                     # Website + web app — React 19, TypeScript, Vite
├── contracts/                    # OpenAPI + AsyncAPI contracts (shared, CODEOWNERS-protected)
├── infra/
│   ├── terraform/
│   │   ├── modules/              # network, ecs-ec2-host, ecs-service, ecr, cdn, cognito, scheduler, observability, github-oidc
│   │   ├── envs/staging/         # staging host B + shared services (Jiawei's account); prod is out of scope
│   │   ├── envs/staging-gateway/ # staging host A (Jiajun's account, ADR-0017)
│   │   └── envs/staging-ml/      # staging host C (Zheng's account, ADR-0017)
│   └── scripts/                  # aws-sleep.sh / aws-wake.sh / aws-status.sh (stop/start/inspect the ECS hosts)
├── docs/
│   ├── DESIGN.md                 # living design doc (from Sentinel_Pay_Design_v2.md + this brief)
│   ├── ROADMAP.md                # schedule & progress
│   ├── TECH_DECISIONS.md         # technology comparisons + ADR index
│   ├── adr/                      # one file per decision: NNNN-title.md
│   ├── runbooks/                 # how to operate / recover each service; ORR checklist
│   ├── postmortems/              # blameless post-incident reviews
│   └── threat-model.md           # STRIDE threat model (Microsoft SDL style)
├── e2e/                          # Postman/Newman collections, Playwright UI tests, sample events
├── docker/postgres/init/         # creates the per-service databases for local development
├── docker-compose.yml            # full local stack
├── Makefile                      # one entry point for common commands (§11)
└── .github/
    ├── CODEOWNERS
    ├── pull_request_template.md
    ├── ISSUE_TEMPLATE/           # bug.yml, question.yml, decision.yml, task.yml
    ├── dependabot.yml
    └── workflows/                # ci-*.yml per component, codeql.yml, deploy-staging.yml, terraform.yml
```

Each component folder may hold its own `CLAUDE.md` with stack-specific commands and conventions. Read it when working in that folder.

---

## 4. System workflow

The overall payment → risk → ML → decision workflow from the design doc **does not change**. One step is added: an **asynchronous LLM insight step**, plus an internal panel to inspect it.

```text
Merchant/App ──▶ payment-gateway ──sync REST──▶ risk-engine ──REST──▶ ml-scorer
                     │  (decision returned, payment continues — unchanged)
                     │
                     ▼ outbox → Kafka
     payments.events.v1          risk.assessments.v1 ──▶ llm-insights  (new, async)
                                                            │ prompt → LLM (Bedrock) → validated JSON
                                                            ├─▶ DB: llm_invocation, risk_insight
                                                            └─▶ Kafka: risk.insights.v1 (new topic)
Frontend:
  Review queue / assessment detail ── shows the LLM case summary & suggestion (labelled "AI-generated, advisory")
  /internal/llm  (new LLM Console) ── developers inspect every LLM call
```

### 4.1 LLM insight step (`llm-insights/`)

- **Trigger:** consumes `RiskAssessmentCreated` from `risk.assessments.v1`. It generates insights for every `REVIEW` decision, plus a configurable sample of `APPROVE`/`DECLINE` decisions for quality monitoring.
- **Input:** assessment details fetched from the risk-engine API: amounts, rule hits, ML factors, customer context. **No names, emails or card data.**
- **Output** (structured JSON, validated with Pydantic):
  - `summary`: 2–4 sentences for the analyst
  - `keySignals[]`
  - `suggestedAction` (`APPROVE` | `DECLINE` | `NEEDS_MORE_INFO`)
  - `confidence` (`LOW` | `MEDIUM` | `HIGH`)
  - `caveats[]`
- **Provider abstraction:** an `LlmProvider` interface with:
  - `BedrockProvider`: Bedrock Converse API via boto3. The model ID comes from config; default to a fast, low-cost Claude model on Bedrock.
  - `StubProvider`: deterministic, used for local dev and CI, with no cost and no network.
- **Prompts** are versioned files: `llm-insights/prompts/<name>/v<N>.md`. Every invocation records `promptName` and `promptVersion`.
- **Guardrails:**
  - 10 s timeout and 2 retries
  - JSON schema validation; invalid output is stored with status `INVALID_OUTPUT`
  - Max input/output tokens
  - Daily cost budget: stop calling and publish nothing once the budget is exceeded
  - Idempotent on `assessmentId`
- **Persistence** (own database `llm`, Flyway-style migrations via Alembic):
  - `llm_invocation`: id, assessmentId, model, promptName, promptVersion, renderedPrompt, rawResponse, parsedOutput, status, latencyMs, inputTokens, outputTokens, estCostUsd, errorMessage, createdAt
  - `insight_feedback`: invocationId, rating (UP/DOWN), comment, userId, createdAt
- **APIs** (add to a new `contracts/openapi-llm-insights-v1.yaml` first):
  - `GET /api/v1/insights/{assessmentId}` (analysts)
  - `GET /api/v1/llm/invocations` (paged, with filters)
  - `GET /api/v1/llm/invocations/{id}`
  - `GET /api/v1/llm/stats`
  - `POST /api/v1/llm/invocations/{id}/feedback`
- **Event:** `RiskInsightGenerated` on the new topic `risk.insights.v1`. Add it to `contracts/asyncapi-events-v1.yaml`; this is an additive change.

### 4.2 LLM Console (`/internal/llm`, developer role only)

- **Overview:** calls per day, success / invalid-output / error rate, p50/p95 latency, tokens and estimated cost per day, a breakdown by prompt version and model, and an analyst feedback ratio.
- **Invocations table:** time, assessment, model, prompt version, status, latency, tokens, cost. Filterable.
- **Invocation detail:**
  - Rendered prompt and raw response side by side
  - Parsed output
  - Validation errors
  - Link to the assessment
  - Analyst feedback
- **Prompt comparison** (Could): compare metrics between two prompt versions.

---

## 5. Frontend information architecture (`frontend/`)

### 5.1 Visual direction

- **Style:** clean, modern fintech marketing style **inspired by** the Stripe Ireland website: large hero with a slogan over a gradient/visual background, generous white space, crisp typography, and subtle scroll animations.
- **Do not copy Stripe's assets.** No logo, wordmark, illustrations, copy, exact gradients or code. Use our own brand "Sentinel Pay", our own colours and our own text.
- **Disclaimer:** every page footer says *"Portfolio project — not a real payment service."* Pricing is labelled as demo pricing.

### 5.2 Routes

| Route | Access | Content |
|---|---|---|
| `/` | public | **Homepage.** Hero (slogan + background visual + CTAs "Start now" / "See a sample"). Scrolling sections: product showcase (animated cards for Payments, Risk Engine, AI insights), how-it-works flow, KPI strip, developer/API snippet, CTA. |
| `/sample` | public | **Interactive demo.** Pre-built scenarios on mock data (normal payment, high amount, blocklisted customer, burst, review → approve). Each step is animated: gateway → risk rules → ML score → LLM summary → decision. Runs fully client-side on a bundled mock dataset (no backend, no cost). |
| `/product` | login required | **The real product.** Merchants: create payments, manage API keys, view their payments. Analysts: review queue. Unauthenticated users are redirected to `/login?returnTo=/product`. |
| `/dashboard` | login required, **role-based** | `merchant` → **Merchant dashboard** (own volume, approval rate, declines by reason, refunds). `analyst` / `admin` → **Transaction analytics dashboard** for support and data analysis (decision mix, decline rate by rule, ML score distribution, fraud-confirmed vs predicted, degraded rate, review backlog and SLA) to decide whether risk strategy needs tuning. The nav label is "Dashboard"; it is shown only when logged in. |
| `/internal/llm` | `developer` / `admin` | LLM Console (§4.2). Not in the public nav; linked from the dashboard for these roles. |
| `/pricing` | public | Demo pricing tiers (Starter / Growth / Enterprise), a fee calculator, and an FAQ. |
| `/about` | public | Team page: the three members, their roles, links (GitHub/LinkedIn placeholders until the user provides them), and the project story. |
| `/docs` | public (Could) | Developer docs rendered from the OpenAPI contracts. |
| `/login`, `/signup` | public | Cognito Hosted UI (redirect) or an embedded flow. |

**Top navigation bar:** left: logo, **Product**, **Sample**, **Dashboard** (when logged in), **About us**, **Pricing**. Right: **Log in** (text button) and **Sign up** (primary button). When logged in, the right side shows an avatar menu with role, settings and logout.

### 5.3 Frontend stack

The original choice was MUI. Proposed for the public site: **Tailwind CSS + shadcn/ui + Framer Motion**, with **TanStack Table** + Recharts in the app area. Jiajun decides; record the decision in `TECH_DECISIONS.md` as an ADR before the first UI PR.

Everything else stays the same:

- React 19, TypeScript strict, Vite, React Router
- TanStack Query
- Typed clients generated from `contracts/` (`openapi-typescript` + `openapi-fetch`)
- React Hook Form + Zod
- MSW mocks
- Vitest + React Testing Library
- Playwright for end-to-end UI tests

Accessibility target: WCAG 2.1 AA (keyboard navigation, contrast, alt text, reduced-motion support).

---

## 6. Authentication & roles

- **Identity provider:** Amazon Cognito user pool. There is one shared **dev/staging pool**; local development uses the same pool, so there's no local IdP to maintain.
- **Groups (roles):** `merchant` (default on sign-up), `analyst`, `admin`, `developer`. Only an admin assigns non-merchant roles.
- **Frontend:** OIDC Authorization Code + PKCE (`react-oidc-context` / `oidc-client-ts`). Tokens are kept in memory; don't put tokens in `localStorage`.
- **Backends:** Spring Security OAuth2 Resource Server validates Cognito JWTs and maps the `cognito:groups` claim to roles. `llm-insights` validates JWTs with the Cognito JWKS.
- **Merchant provisioning:** on a merchant's first login, the frontend calls `POST /api/v1/merchants/me`. The gateway creates the merchant record linked to the Cognito `sub`.
- **Server-to-server:** merchant API keys (`X-API-Key`) remain for programmatic payment calls. `/api/v1/ops/**` and analytics endpoints now require `analyst`/`admin` JWTs. They are **no longer unauthenticated**; update the gateway contract.
- **Authorisation rule:** a user only sees their own merchant's data. Cross-tenant access returns 404.

---

## 7. AWS architecture (staging) — three ECS hosts in three accounts + scheduled start/stop

**Decision (ADR-0007, amended by ADR-0017):** the backend runs under **ECS on three EC2 Graviton `t4g.small` hosts**, one in each team member's AWS account. All three are in **eu-north-1** (ADR-0015) and the same availability zone (AZ ID `eun1-az1`), joined by **cross-account VPC peering**, and started and stopped on one schedule. Managed services stay where they are cheap or free (S3, CloudFront, Cognito, Bedrock, ECR). Production would use Fargate + ALB + Multi-AZ RDS; that is the documented migration path, not the current build.

**`docs/DESIGN.md` §19 is the full specification** (topology, components, schedule, per-account cost, network flows, fallback). This section keeps only what you need while working.

### 7.1 Hosts and owners

| Host | AWS account (owner, configures it) | Containers | Terraform root |
|---|---|---|---|
| **B: engine** (public entry; live since M0) | Jiawei | nginx (:80), risk-engine (:8081), PostgreSQL 18 (:5432; databases `sentinel`, `gateway`, `llm`) | `infra/terraform/envs/staging` |
| **A: gateway** | Jiajun | payment-gateway (:8080), Kafka KRaft (:9092) | `infra/terraform/envs/staging-gateway` |
| **C: ml** | Zheng | ml-scorer (:8000), llm-insights (:8001), ml-feedback | `infra/terraform/envs/staging-ml` |

```text
Browser ─HTTPS─▶ CloudFront ─/*────▶ S3 (React build, OAC)                     [account B]
                            └/api/*─▶ host B nginx :80 (prefix list + secret header)
host B 10.42.1.10 ◀──peering──▶ host A 10.43.1.10 ◀──peering──▶ host C 10.44.1.10
```

- **Network:** VPCs `10.42.0.0/16` (B), `10.43.0.0/16` (A), `10.44.0.0/16` (C). Fixed host IPs `10.4x.1.10`. Security groups admit one port per flow from the peer host's `/32` only (`DESIGN.md` §19.8). Hosts A and C take no internet traffic; nginx on B proxies to them.
- **Service-to-service calls:** same host → `http://172.17.0.1:<port>`; other host → the peer's fixed private IP, set through env vars.
- **Peering is verified before anything depends on it (RISK-166).** If the Free plan blocks it, the fallback is Elastic IPs + TLS everywhere (`DESIGN.md` §19.8).
- **Images:** ARM64 only, built once and stored in **account B's ECR**; accounts A and C pull through repository policies.
- **Deploys:** one `deploy-staging.yml` behind the `staging` environment approval; it assumes a GitHub OIDC role in each account.
- **LLM:** Bedrock in account C, called with the `llm-insights` ECS **task role** — no API key. Default Claude Haiku 5.5 via the `eu.` inference profile; fallback Amazon Nova Lite in-Region.
- **Secrets:** SSM Parameter Store SecureString in each account, injected as ECS task `secrets`. Credentials that must reach another account go through a password manager's one-time share, never GitHub, chat or email.
- **Access:** no SSH; SSM Session Manager only. Each owner reaches their own host.
- **Memory (2 GiB each, incl. ~400 MiB OS + agent):** B ~1.4 GiB, A ~1.7 GiB, C ~1.0 GiB. Set container memory limits and JVM `-XX:MaxRAMPercentage=75`.

### 7.2 Scheduled start/stop

- EventBridge Scheduler in each account (`Europe/Dublin`), same `start_cron` / `stop_cron`.
- **Now (development): every day 19:00–02:00. Demo window from M5 (RISK-117): Mon–Fri 09:00–23:00**, changed in all three accounts together.
- `make aws-wake` / `make aws-sleep` ask for confirmation. Services retry their database and Kafka connections at start-up, because container dependencies cannot span hosts. Target: usable ≤ 5 minutes after start.
- The frontend (S3 + CloudFront) is always available and shows the "Demo environment is sleeping" banner when `/api/health` does not answer.

### 7.3 Cost and trade-offs

- About **USD 30–35/month in total** on the development window, paid from three Free-plan credits: B ≈ $13–15, A ≈ $9–10, C ≈ $8–10 (`DESIGN.md` §19.4). Same-AZ peering traffic is free.
- AWS Budgets alerts in every account's first apply. Tag every resource `project=sentinel-pay`, `owner`, `env=staging`.
- No high availability: A or B down stops payments; C down means rules-only (`degraded`) assessments and no insights.
- Traffic between hosts is unencrypted inside peered VPCs (threat model T19). PostgreSQL and Kafka are self-managed.

**Never run `terraform apply`, start/stop a host, or create AWS resources without explicit confirmation from the owner of that account in the current conversation.** `terraform plan` is fine. Changes that touch another account (peering, ECR policies, database users) also need that owner's agreement in the PR.

---

## 8. CI/CD (GitHub Actions)

| Workflow | Trigger | Steps |
|---|---|---|
| `ci-backend.yml`, `ci-gateway.yml` | PR / push touching the folder or `contracts/` | `./mvnw -B verify` (unit + Testcontainers), JaCoCo coverage report |
| `ci-ml.yml`, `ci-llm.yml` | same | `uv sync`, `ruff check`, `ruff format --check`, `mypy`, `pytest` (StubProvider only, no cloud calls) |
| `ci-frontend.yml` | same | `npm ci`, lint, typecheck, unit tests, build, Playwright smoke against the preview build |
| `contracts.yml` | changes in `contracts/` | Validate OpenAPI (Redocly/Spectral) and AsyncAPI (AsyncAPI CLI); detect breaking changes (`oasdiff`) |
| `codeql.yml` | PR + weekly | CodeQL for Java, Python, JavaScript/TypeScript |
| `terraform.yml` | changes in `infra/` | `terraform fmt -check`, `validate`, `tflint`, `checkov`/`trivy config`, `plan` posted as a PR comment |
| `deploy-staging.yml` | push to `main` (after CI) or manual | Configure AWS via **GitHub OIDC** → build **ARM64** images → Trivy scan → push to ECR (tag = git SHA) → **approval gate: GitHub Environment `staging` with required reviewer** → start the EC2 host if it is stopped and wait for ECS → register new task definitions and update ECS services (circuit-breaker rollback) → frontend build → S3 sync → CloudFront invalidation → post-deploy smoke test through the CloudFront URL |

Also:

- **Dependabot** for Maven, pip/uv, npm, GitHub Actions and Docker.
- **Releases:** semantic version tags `vX.Y.Z`, generated release notes, and `CHANGELOG.md`.
- **Branch ruleset on `main`:** PR required, 1 approval, CODEOWNERS review, all required checks green, linear history (squash merge), no force-push.

---

## 9. Engineering process (Amazon / Microsoft style)

### 9.1 Planning and tracking

- **GitHub Issues + one GitHub Project** ("Sentinel Pay") are the backlog and the sprint plan. There is no Jira.
  - Every piece of work is an issue titled `[RISK-<n>] …`. `RISK-<n>` is the backlog ID used in `docs/ROADMAP.md`, branch names and commits; a new item takes the next free number.
  - The project board has the columns To do → In progress → In review → Done, an *Iteration* field for the one-week sprints, an *Estimate* field (hours), and GitHub **milestones** `M0` … `M5`.
  - Labels: one type (`task`, `bug`, `question`, `decision-needed`, `blocked`) and one component (`backend`, `gateway`, `frontend`, `ml`, `llm`, `infra`, `contracts`, `docs`).
  - Questions, decisions, bugs and blockers between teammates are issues too (templates in `.github/ISSUE_TEMPLATE/`).
  - A PR says `Closes #<issue>` so merging it closes the issue and moves the card.
- **One-week sprints.** Status lives in `docs/ROADMAP.md`, updated at least weekly.

### 9.2 Design before build

- New components and significant changes need a design section in `DESIGN.md` reviewed through a PR (a design review) **before** implementation.
- Each technology choice gets an ADR (`docs/adr/NNNN-title.md`: Context, Options, Decision, Consequences) and a row in `TECH_DECISIONS.md`.
- Customer-facing features start from the customer. Add a short "Working Backwards" paragraph (Amazon PR/FAQ style) at the top of the feature's design section: who the customer is, their problem, and how this solves it.
- Security: update `docs/threat-model.md` (STRIDE) when adding a new entry point, data store or external dependency (Microsoft SDL).

### 9.3 Branches, commits, PRs

- **Branch:** `feature/RISK-<n>-short-name`, `fix/RISK-<n>-…`, `chore/…`, `docs/…`.
- **Commits:** Conventional Commits with the backlog ID, e.g. `feat(gateway): RISK-73 add idempotency key replay`.
- **PR description** (template enforced) covers:
  - Linked issue (`Closes #<n>`)
  - What / why
  - How it was tested
  - Screenshots for UI changes
  - Risk and rollback plan
  - Docs updated?
  - Contract changed?
  - AI assistance used (which parts)
- **Review:** within 24 h, at least one non-author approval. The author resolves every comment or explains why not.

### 9.4 GitHub issue template (use it when you hit a question or blocker)

```markdown
Title: [RISK-<n>] <short question or problem>
Labels: question | decision-needed | bug | blocked, plus component label
Assignee: <owner of the affected area>

## Context
What we are doing and where (files, endpoint, contract section).

## Problem / Question
The specific thing that is unclear or broken.

## Options considered
1. Option A — pros / cons
2. Option B — pros / cons

## Recommendation
What we suggest and why.

## Needed by
Date / milestone and what is blocked until then.
```

### 9.5 Definition of Done

1. Acceptance criteria met; issue linked.
2. Tests added; CI green; coverage not reduced on core packages.
3. Reviewed and approved by a teammate.
4. Contracts, `DESIGN.md`, `ROADMAP.md`, `TECH_DECISIONS.md`, runbooks updated where relevant.
5. No secrets, PII or card data; no new high/critical findings from CodeQL or Trivy.
6. Deployed to staging and smoke-tested (once the deploy pipeline exists).

### 9.6 Operational excellence

- Each service exposes health endpoints, emits structured JSON logs with `X-Request-Id`, and has at least one CloudWatch alarm.
- Each service has a runbook in `docs/runbooks/<service>.md`: purpose, dependencies, dashboards, alarms, common failures and fixes, how to roll back.
- An **Operational Readiness Review** checklist must pass before each release; keep it in `docs/runbooks/orr-checklist.md`.
- Incidents and major bugs get a blameless post-incident review (`docs/postmortems/`).

---

## 10. The three living documents

| File | Purpose | Must contain | Update when |
|---|---|---|---|
| `docs/DESIGN.md` | How the system works | Overview and goals; architecture diagrams; components; workflows (payment, held payment, LLM insight); data models; contracts summary; frontend IA (§5); auth (§6); AWS architecture (§7); NFRs; risks; open questions | Any behaviour or architecture change |
| `docs/ROADMAP.md` | When and who | Milestones with target dates; sprint plan; per-person backlog with backlog IDs and status; dependency/hand-off table; progress log (dated entries); risks to schedule | Every sprint planning, weekly status, and whenever scope/dates move |
| `docs/TECH_DECISIONS.md` | Why this technology | One comparison table per decision (options × criteria: fit, learning curve, cost, ecosystem/hiring signal, operational burden); chosen option; ADR link; review date | Any new dependency, service, cloud resource or replacement |

Seed decisions for `TECH_DECISIONS.md`:

- Java/Spring Boot 4 vs Kotlin/Quarkus
- Maven vs Gradle
- PostgreSQL vs MySQL vs DynamoDB
- Kafka self-hosted vs Amazon MSK vs SQS/SNS vs EventBridge
- ECS on EC2 vs ECS Fargate vs EKS vs Lambda
- Terraform vs AWS CDK vs CloudFormation
- Cognito vs Auth0 vs Keycloak
- Bedrock vs direct LLM API
- Tailwind/shadcn vs MUI
- GitHub Actions vs AWS CodePipeline
- Public subnets vs NAT Gateway
- **Three ECS hosts in three accounts (accepted, ADR-0017; amends the single host of ADR-0007)** vs one `t4g.medium` on the Paid plan vs Fargate + ALB + RDS vs App Runner vs Lightsail vs non-AWS hosts (Oracle Free Tier, Hetzner) — include the cost table from `DESIGN.md` §19.4
- PostgreSQL container + backups vs RDS
- CloudFront with HTTP origin (prefix list + secret header) vs ALB + ACM vs own domain with TLS origin
- Scheduled start/stop (EventBridge Scheduler) vs always-on vs Spot
- **FastAPI (accepted, ADR-0009)** vs Django + Django REST Framework vs Flask for the Python services

---

## 11. Commands (Makefile targets to create during bootstrap)

```text
make up              # docker compose up -d (full local stack, LLM uses StubProvider)
make down            # docker compose down
make test            # run all component test suites
make test-<c>        # backend | gateway | ml | llm | frontend
make lint            # all linters/formatters in check mode
make contracts       # validate OpenAPI/AsyncAPI + breaking-change check
make e2e             # Newman API scenarios + Playwright UI smoke against local stack
make tf-plan         # terraform plan for staging (read-only)
make aws-wake        # start the EC2 host and wait for all ECS services to be steady (asks for confirmation)
make aws-sleep       # stop the EC2 host (asks for confirmation)
make aws-status      # instance state, ECS service health, next scheduled start/stop
```

Local ports: gateway 8080 · risk-engine 8081 · ml-scorer 8000 · llm-insights 8001 · frontend 5173 (dev) / 3000 (docker) · postgres 5432 · kafka 9092 · kafka-ui 8085.

---

## 12. Coding standards

- **Java:**
  - Package-by-feature; constructor injection; records for DTOs.
  - `BigDecimal` for money; `java.time` with an injected `Clock`.
  - RFC 9457 Problem Details for errors; no field injection.
  - Formatting with Spotless (Google Java Format).
- **Python:**
  - Type hints everywhere; Pydantic v2 models matching the contracts.
  - FastAPI for both Python services (ADR-0009).
  - ruff (lint + format) and mypy; no business logic in route handlers.
  - Settings via `pydantic-settings`.
- **TypeScript/React:**
  - Strict mode; no `any`; generated API types only (never hand-written duplicates).
  - Server state in TanStack Query; components small and testable; ESLint + Prettier.
- **Terraform:**
  - Modules with variables and outputs; no hard-coded account IDs or ARNs.
  - Every resource tagged; `terraform fmt`.
- **General:**
  - Meaningful names over comments; comments explain *why*.
  - Log at the right level; never log secrets, tokens or full request bodies.

## 13. Testing standards

- **Unit:** domain logic, state machines, rules, fee/ledger maths, prompt rendering and output parsing.
- **Integration:** Testcontainers (PostgreSQL, Kafka); WireMock for HTTP dependencies; moto or a stubbed boto3 client for AWS calls.
- **Contract:** responses validated against `contracts/`.
- **End-to-end:**
  - Newman scenarios E1–E9 and P1–P14 from `DESIGN.md`.
  - New L1–L4 for the LLM step:
    - L1: insight generated for a REVIEW case
    - L2: invalid LLM output is stored as `INVALID_OUTPUT`, with no crash
    - L3: Bedrock unavailable → payments unaffected
    - L4: daily budget exceeded → calls stop
  - Playwright for homepage, sample flow, login redirect and role-based dashboard.
- Coverage target ≥ 80 % on core domain packages.
- **CI never calls paid external APIs.**

---

## 14. First session: bootstrap checklist

Work through these in order. Each item is its own branch and PR unless noted. Before starting, confirm with the user which items to do in this session.

1. **Repo hygiene:** `.gitignore` (Java, Python, Node, Terraform, IDE), `.editorconfig`, `README.md` skeleton (what it is, architecture image placeholder, quick start, disclaimer), `LICENSE` (ask the user which licence), `CODEOWNERS`, PR template, issue templates (§9.4), `dependabot.yml`.
2. **Docs:** create `docs/DESIGN.md` from `Sentinel_Pay_Design_v2.md` (the user will provide it) **plus** the new requirements in §4–§7 of this file. Then create `docs/ROADMAP.md` and `docs/TECH_DECISIONS.md` (with the seed decisions in §10) and `docs/adr/0001-record-architecture-decisions.md`. Mark anything not yet agreed as **Proposed**.
3. **Re-plan the schedule** in `ROADMAP.md`. Scope has grown (website, auth, LLM, AWS), so the old dates (v1.0 on 29 Nov, v2.0 on 13 Dec) no longer hold. Propose milestones for the team to confirm:
   - **M0 Walking skeleton:** one hello-world service and the frontend shell deployed to AWS through the full CI/CD pipeline. Ship the pipeline first; this is standard enterprise practice.
   - **M1:** risk engine + ML
   - **M2:** gateway + Kafka
   - **M3:** website, auth and dashboards
   - **M4:** LLM insights + console
   - **M5:** hardening, ORR, release v1.0

   Put the dates and owners in as **Proposed**, and open a `decision-needed` issue for team sign-off.
4. **Contracts:** add `openapi-llm-insights-v1.yaml`; add `risk.insights.v1` to the AsyncAPI file; secure the ops/analytics endpoints with JWT in the gateway and risk contracts; add `POST /api/v1/merchants/me`. Run `make contracts`.
5. **Tooling:** `Makefile`, `docker-compose.yml` skeleton, `contracts.yml` and `codeql.yml` workflows.
6. **Infra skeleton** (plan only): `infra/terraform` with remote-state bootstrap instructions and the modules from `DESIGN.md` §19.2 (`network`, `ecs-ec2-host`, `ecr`, `scheduler`, `github-oidc` first), ADR-0007 for the single-host decision, `aws-wake`/`aws-sleep`/`aws-status` scripts, and the `deploy-staging.yml` workflow behind the `staging` environment approval. Add the AWS Budgets alerts in the very first apply. **Stop and ask before any apply.**
7. **Component `CLAUDE.md` files** for `backend/`, `payment-gateway/`, `ml-scorer/`, `llm-insights/`, `frontend/`, `infra/`, holding stack-specific commands and conventions.
8. Summarise what was created, list open questions as draft GitHub issues, and suggest the next backlog issues.

---

## 15. When to stop and ask the user

- Requirements in this file and `docs/` conflict, or are missing.
- A change touches another owner's folder or a frozen contract.
- Anything that costs money, deletes data or changes AWS/GitHub settings.
- A dependency major-version choice, or a new third-party service.
- You are not sure an API or library behaves as you think. Say so and propose how to verify.

---

<!-- BEGIN AWS Agent Toolkit rules -->
## AWS Agent Toolkit rules

Source: [`aws-starter-rules.md`](https://github.com/aws/agent-toolkit-for-aws/blob/main/rules/aws-starter-rules.md)
from the AWS Agent Toolkit, adopted in RISK-115 (23 Nov 2026). The team's AWS account is a project in the
*new AWS experience*, so the starter rules apply.

**Project decisions take precedence** where they differ (the rules say so themselves):

- Infrastructure is defined in **Terraform** (ADR-0011), not CDK or CloudFormation.
- The project Region is **eu-north-1** (ADR-0015). Never create Regional resources elsewhere.
- Golden rule 11 still applies: ask before `terraform apply`, creating or deleting AWS resources, or anything that costs money.
- Never put the AWS account ID, credentials or tokens in the repository, issues or PRs (golden rule 3).

Each host lives in its owner's own AWS account (ADR-0017): Jiawei's (profile `sentinel-pay`) runs host B and the shared
services, Jiajun's runs host A (gateway) and Zheng's runs host C (ml). Each person works only in their own account and
never shares credentials. The rules above apply in every account; before creating anything, a teammate confirms their
account's Region is eu-north-1 and records the plan (RISK-168, RISK-169).

## AWS Guidance for the new AWS experience

This user has signed up for the new AWS experience. This experience lets you sign into AWS using a social provider and requires the following additional context.

Where this guidance conflicts with the project's own instructions, the project's instructions take precedence.

### Context

#### Terminology:

- Say "project" instead of "account" — a project contains an AWS account and settings for sharing with other collaborators
- Say "team member" instead of "IAM user" — users are invited by email, not created or federated in IAM
- Say "AWS Settings" when referring to management tasks at [settings.aws.com](https://settings.aws.com/) (project management, billing, team members, spend limits). Users view their actual AWS resources in the AWS Management Console.
- Say "selected Region" when referring to the user's Region — not "home Region"
- The user has a managed IAM experience. This includes a managed service control policies (SCP) and resource control policies (RCP) that govern the use of AWS. They will still need to use IAM to create policies to let services work with each other. If there are questions about the SCPs or RCPs, go to the documentation at https://docs.aws.amazon.com/accounts/latest/reference/scps-and-rcps-for-projects.html

#### Constraints:

- All projects share a single AWS Region determined by the user's contact address. Resources cannot be created in other Regions
- When developing:
  - MUST create all Regional resources in the project's assigned Region
  - You CAN create AWS WAF and Cloudwatch Logs resources in us-east-1 when there are global resources (like a global WAF instance) that require a connection to dependencies in us-east-1. You should not use these for any other reason, because resources in the selected Region will provide lower cost (due to no cross-Region traffic), increased availability (due to no cross-Region traffic), and easier manageability (due to not needing to look in another Region). When you need to do an inventory of resources, you need to look in both the selected Region and us-east-1 for Cloudwatch Logs or WAF resources.
  - MUST NOT attempt to create Lambda, API Gateway, or other Regional resources in any other Region
  - MUST direct users to confirm their Region in AWS Settings > View all projects > Overview > Additional Info > Region. If the user cannot confirm their Region, check in ~/.aws/config
  - MUST NOT use Lambda@Edge — excluded from both Lambda and CloudFront
  - MUST NOT use CloudFormation StackSets — no multi-account or multi-Region deployments
  - MUST NOT attempt cross-Region actions — no cross-Region replication for DynamoDB/S3/RDS, no multi-Region KMS keys
  - MUST NOT use Route 53 cross-Region routing — geolocation, latency-based, and failover routing policies are not available
  - CloudFront is a global service and its actions ARE allowed in `us-east-1`. A user can create a CloudFront distribution pointing to their project-region Lambda function URL or API Gateway. However, Lambda and API Gateway themselves MUST NOT be created in `us-east-1` — they must be in the project Region.
  - Reduced availability in `eu-north-1` specifically: Amazon Rekognition, Amazon Textract, Amazon Personalize, AWS App Runner are not available in that Region.
- IAM permissions for human access are managed by AWS. Don't assign roles to team members unless absolutely necessary
- The user may have a spend limit if they are on the paid plan. The limit that pauses their project if it's exceeded. If resources suddenly become inaccessible, ask if they have a spend limit configured. Only project owners can modify a spend limit.
- When developing:
  - MUST ask about spend limit status if the user reports sudden "Access Denied" errors on operations that previously worked
  - MUST direct users to check spend status in AWS Settings > Billing
  - MUST check if a user has upgraded their account to the paid plan
  - MUST ask the user if they want to clean up the successfully created resources or keep them to reduce cost
- The user sets up billing, creates spend limits, and retrieves and pays invoices in AWS Settings. The user creates budgets and optimizes their costs in the AWS Billing and Cost Management console
- Not all AWS services are available. If a service isn't working, do the following:
  1. Run the command `aws freetier get-account-plan-state`
  2. If accountPlanType": "FREE", check the [Free Tier supported services list](https://docs.aws.amazon.com/accounts/latest/reference/supported-services-sign-up-new.html#supported-services-free-tier) next,
  3. If accountPlanType": "PAID", check the [Paid Tier supported services list](https://docs.aws.amazon.com/accounts/latest/reference/supported-services-sign-up-new.html#supported-services-paid-plan).
  4. If neither list shows the service, check the [Not supported for this experience list](https://docs.aws.amazon.com/accounts/latest/reference/supported-services-sign-up-new.html#unsupported-services). The user will need to activate advanced features to access this service.
- Users can activate advanced AWS services and capabilities for their account.
- For any AWS task or question — building, configuring, migrating, debugging, or operating a service, writing SDK code, authoring CDK/CloudFormation, or answering how a service works — first call `aws___search_documentation` with topic `agent_skills` and load the matching skill with `aws___retrieve_skill`. Do this even when you believe you know the answer: skills carry current service behavior that your training may not. Prefer the skill's guidance over general knowledge. Skip it only for work that does not involve AWS.

#### Help level

**Saved help_level: HIGH** — chosen by Jiawei Zhou on 23 Nov 2026. A teammate may choose another level for their own sessions; ask them the first time.

- help_level (required): LOW, MEDIUM, or HIGH. While a user is building, you MUST ask the user: "How much guidance would you like from me? Low (I only flag security risks), medium (I ask a couple of clarifying questions if something seems off), or high (I explain what I'm doing, suggest alternatives, and flag best practices)."

You CAN update this rule file to save a user's help_level.

Constraints for each level:

**LOW:**

- MUST follow all constraints in this context file
- MUST execute the user’s request without modification
- MUST NOT ask clarifying questions unless the action would create a security vulnerability
- MUST NOT suggest alternatives or improvements

**MEDIUM:**

- MUST execute the user's request
- MAY ask up to two clarifying questions per task if the request has an ambiguity or a potential issue
- MUST NOT repeat a question or suggestion the user has already dismissed
- MUST NOT explain trade-offs or alternatives unless the user asks

**HIGH:**

- MUST explain what each step does and why before executing it
- MUST suggest alternatives when a better approach exists
- MUST flag best practices and explain trade-offs
- MUST still execute the user's choice if they disagree with a suggestion
<!-- END AWS Agent Toolkit rules -->
