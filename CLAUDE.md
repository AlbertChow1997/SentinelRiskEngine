# CLAUDE.md — Sentinel Pay

Instructions for Claude Code working in this repository. Read this file at the start of every session.
If something here conflicts with `docs/DESIGN.md`, **ask the user**. Don't guess.

---

## 1. Project snapshot

**Sentinel Pay** is a three-person portfolio project that simulates an enterprise fintech product: a **payment gateway** with a **real-time risk engine** (rules + ML), an **LLM insight step**, and a **public website and web app**. It is built and run the way an Amazon or Microsoft team would: design docs, small reviewed PRs, CI/CD, infrastructure as code, and operational readiness.

| Person | GitHub | Owns |
|---|---|---|
| Jiawei Zhou | @AlbertChow1997 | Tech lead · `backend/` (risk engine) · `payment-gateway/` · `infra/` · CI/CD · releases |
| Jiajun Xiao | @jiajunxiao-work | `frontend/` (website + web app) |
| Zheng Liu | @zliu-59 | `ml-scorer/` · proposed owner of `llm-insights/` (confirm via issue) |

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
│   │   └── envs/staging/         # the one AWS environment (staging); prod is out of scope
│   └── scripts/                  # aws-sleep.sh / aws-wake.sh / aws-status.sh (stop/start/inspect the ECS host)
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

## 7. AWS architecture (staging) — single-host ECS + scheduled start/stop

**Decision (ADR-0007, accepted):** run all backend containers with **ECS on one EC2 Graviton instance**, and start/stop it on a schedule. Keep managed AWS services where they are cheap or free (S3, CloudFront, Cognito, Bedrock, ECR). Production would use Fargate + ALB + Multi-AZ RDS; that is the documented migration path, not the current build. Region: **eu-west-1 (Ireland)**.

### 7.1 Topology

```text
Browser ──HTTPS──▶ CloudFront (dxxxx.cloudfront.net)
                     ├── /*        → S3 bucket (React build, Origin Access Control)
                     └── /api/*    → EC2 origin (Elastic IP DNS, HTTP :80)
                                      SG: inbound :80 only from the CloudFront origin-facing
                                      managed prefix list + secret header checked by nginx
EC2 t4g.medium (ARM64, 4 GB, ECS-optimised Amazon Linux 2023, public subnet, Elastic IP)
 └── ECS cluster "sentinel-staging" (EC2 capacity, bridge networking, static host ports)
      ├── nginx (:80)            path routing → services below; rejects requests without the CloudFront secret header
      ├── payment-gateway (:8080)   risk-engine (:8081)   ml-scorer (:8000)   llm-insights (:8001)
      ├── ml-feedback (no port)
      ├── kafka (:9092, KRaft)   data on /data/kafka
      └── postgres (:5432)       data on /data/postgres  (databases: sentinel, gateway, llm)
 └── EBS gp3 30 GB root + EBS gp3 20 GB data volume mounted at /data
Managed services: ECR · Cognito · Bedrock · SSM Parameter Store · CloudWatch Logs/Alarms · EventBridge Scheduler · DLM snapshots · AWS Budgets
```

### 7.2 Components and choices

| Concern | Choice | Notes |
|---|---|---|
| IaC | **Terraform**, remote state in S3 (+ DynamoDB lock, or S3 native locking if the provider version supports it — check) | Modules: `network`, `ecs-ec2-host`, `ecs-service`, `ecr`, `cdn`, `cognito`, `scheduler`, `observability`, `github-oidc` |
| Compute | One **t4g.medium** On-Demand instance, **standalone (not an Auto Scaling Group)** so stop/start keeps its EBS volumes and data | AMI from SSM parameter `/aws/service/ecs/optimized-ami/amazon-linux-2023/arm64/recommended/image_id`; user data registers it to the ECS cluster and mounts `/data`; 2 GB swap file as a safety net |
| Container orchestration | **ECS on EC2**, one ECS service per component, **bridge** network mode with static host ports | `minimumHealthyPercent = 0`, `maximumPercent = 100` (one host + static ports means a short restart per deploy — accepted, documented). Deployment circuit breaker with rollback enabled |
| Service-to-service calls | Via the host: services call each other at `http://<docker0 gateway>:<port>` (e.g. `172.17.0.1:8000`) set through env vars | Service Connect is the cleaner option but its Envoy sidecars cost ~50 MB each; revisit if memory allows (record in TECH_DECISIONS) |
| Images | **ARM64 only** (`linux/arm64`), built on GitHub-hosted ARM runners or with `docker buildx`; stored in **ECR** with scan-on-push and a lifecycle policy (keep last 10) | Verify every base image (Kafka, Postgres, Python, JRE) publishes `linux/arm64` |
| Database | **PostgreSQL 18 container** on the data volume | Nightly `pg_dump` to a private S3 bucket (7-day lifecycle) + daily EBS snapshots via **Data Lifecycle Manager** (keep 7). Upgrade path: RDS |
| Kafka | **Single-broker KRaft container** on the data volume | MSK is too costly; outbox tables remain the source of truth |
| Ingress | **CloudFront** for HTTPS on the default `*.cloudfront.net` domain; nginx on the instance as reverse proxy | CloudFront → origin is HTTP, locked to the CloudFront prefix list + secret header (stored in SSM). Upgrade path: own domain + TLS to origin. No ALB (saves ~$18/month) |
| Static IP | One **Elastic IP** so the CloudFront origin hostname survives stop/start | Billed hourly whether the instance runs or not (~$3.6/month) |
| Auth | Cognito user pool, app client, Hosted UI domain; callback/logout URLs = the CloudFront domain + `http://localhost:5173` | Free tier covers this project |
| LLM | Amazon Bedrock; instance role allows `bedrock:InvokeModel` on the chosen model ARN only | Model access must be enabled in the account first |
| Secrets & config | **SSM Parameter Store** SecureString, injected as ECS task `secrets` | No secrets in task definitions, images or Git |
| Access | **No SSH.** SSM Session Manager only (instance role `AmazonSSMManagedInstanceCore`); SG has no port 22 | |
| Observability | `awslogs` driver → CloudWatch Logs (**7-day retention**); alarms on EC2 status check, container restarts, nginx 5xx (from logs metric filter), LLM error rate and daily cost; one CloudWatch dashboard | Alarms use `treat_missing_data = notBreaching` so scheduled downtime doesn't page anyone |
| Memory budget (4 GB) | gateway 512 MB · risk-engine 512 MB · kafka 768 MB (heap 512 MB) · postgres 384 MB · ml-scorer 256 MB · llm-insights 256 MB · ml-feedback 128 MB · nginx 32 MB · OS + ECS agent ~400 MB ≈ **3.3 GB** | Set container memory limits and JVM `-XX:MaxRAMPercentage=75`; if OOMs appear, move to t4g.large (record in ROADMAP) |

### 7.3 Scheduled start/stop

| Item | Setting |
|---|---|
| Scheduler | **EventBridge Scheduler** (timezone `Europe/Dublin`) with two schedules calling EC2 `StartInstances` / `StopInstances` on the tagged instance |
| Default window | **Mon–Fri 09:00–23:00**; off at weekends. Window values are Terraform variables |
| Manual override | `make aws-wake` (start instance, wait until all ECS services are steady) and `make aws-sleep` (stop instance); both ask for confirmation. Use `aws-wake` before interviews/demos outside the window |
| Boot behaviour | ECS agent re-registers the instance; services restart automatically (desired counts stay 1); postgres and kafka start first via container dependencies/health checks. Target: system usable **≤ 5 minutes** after start |
| Deploys while stopped | `deploy-staging.yml` checks the instance state; if stopped it starts it, deploys, runs smoke tests, and leaves it running until the next scheduled stop |
| Frontend | Always available (S3 + CloudFront). When the backend is asleep, the web app shows a friendly "Demo environment is sleeping — available Mon–Fri 09:00–23:00 Irish time" banner (frontend checks `/api/health` with a short timeout). `/sample` keeps working because it is fully client-side |

### 7.4 Cost (indicative — re-check with the AWS Pricing Calculator and record in TECH_DECISIONS)

| Item | Monthly |
|---|---|
| t4g.medium, ~14 h × 22 weekdays ≈ 310 h | ~$11–12 |
| EBS gp3 root 30 GB + data 20 GB | ~$4–5 |
| Elastic IP (charged 24/7) | ~$3.6 |
| EBS snapshots, S3 backups, ECR storage | ~$1–2 |
| CloudFront, S3 website, Cognito, CloudWatch (7-day logs) | ~$0–2 (mostly free tier) |
| Bedrock tokens (demo volume, budget-capped) | ~$1–3 |
| **Total** | **≈ $20–28/month**; the same setup running 24/7 ≈ $40–45 |

New-account AWS credits (if available) cover this for many months. **AWS Budgets** alerts at **$15 (forecast)** and **$25 (actual)**. Tag every resource `project=sentinel-pay`, `owner`, `env=staging`.

### 7.5 Known trade-offs (document in ADR-0007)

- Single host = no high availability; brief downtime per deploy; host failure means rebuild from snapshot. Acceptable for a demo environment.
- CloudFront → origin traffic is unencrypted HTTP, mitigated by the prefix-list rule and secret header; production would use TLS to the origin (own domain + certificate).
- Postgres and Kafka self-managed: we own backups and upgrades.
- Migration path to production shape: swap `ecs-ec2-host` for Fargate services behind an ALB, move Postgres to RDS, Kafka to MSK — the `ecs-service` module and task definitions stay largely the same.

**Never run `terraform apply`, start/stop the instance, or create AWS resources without explicit user confirmation in the current conversation.** `terraform plan` is fine.

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
- **Single EC2 host running ECS (accepted, ADR-0007)** vs Fargate + ALB + RDS vs App Runner vs Lightsail vs non-AWS hosts (Oracle Free Tier, Hetzner) — include the cost table from §7.4
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
6. **Infra skeleton** (plan only): `infra/terraform` with remote-state bootstrap instructions and the modules from §7.2 (`network`, `ecs-ec2-host`, `ecr`, `scheduler`, `github-oidc` first), ADR-0007 for the single-host decision, `aws-wake`/`aws-sleep`/`aws-status` scripts, and the `deploy-staging.yml` workflow behind the `staging` environment approval. Add the AWS Budgets alerts in the very first apply. **Stop and ask before any apply.**
7. **Component `CLAUDE.md` files** for `backend/`, `payment-gateway/`, `ml-scorer/`, `llm-insights/`, `frontend/`, `infra/`, holding stack-specific commands and conventions.
8. Summarise what was created, list open questions as draft GitHub issues, and suggest the next backlog issues.

---

## 15. When to stop and ask the user

- Requirements in this file and `docs/` conflict, or are missing.
- A change touches another owner's folder or a frozen contract.
- Anything that costs money, deletes data or changes AWS/GitHub settings.
- A dependency major-version choice, or a new third-party service.
- You are not sure an API or library behaves as you think. Say so and propose how to verify.
