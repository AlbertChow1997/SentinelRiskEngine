# Sentinel Pay — Software Design Document

| | |
|---|---|
| **Status** | Living document. Anything marked **Proposed** awaits team sign-off |
| **Version** | 3.0 (11 Nov 2026) — built from *Sentinel Pay SDD v2.0* (10 Nov 2026) plus the v3.0 scope: public website, authentication, LLM insight step, AWS staging |
| **Author / Tech lead** | Jiawei Zhou |
| **Team** | Jiawei Zhou (Risk Engine, Payment Gateway, infrastructure, CI/CD) · Jiajun Xiao (Frontend) · Zheng Liu (ML Scoring; proposed owner of LLM Insights) |
| **Repo** | `github.com/AlbertChow1997/SentinelRiskEngine` (private monorepo; rename to `sentinel-pay` proposed — Q6) |
| **Tracking** | GitHub Issues + the GitHub Project "Sentinel Pay"; backlog IDs `RISK-<n>` (design v2.0 planned Jira; replaced on 11 Nov 2026 — `TECH_DECISIONS.md` D17) |
| **Contracts** | `contracts/` — summary in Section 6, status in `contracts/README.md` |
| **Schedule** | `docs/ROADMAP.md` (milestones M0–M5). The dates in design v2.0 no longer hold |
| **Decisions** | `docs/TECH_DECISIONS.md` and `docs/adr/` |

> **Reading guide — release names.** Sections 7–12 were written for design v2.0 and still say "Release 1 / v1.0" and "Release 2 / v2.0". Read these as **scope labels**, not release tags:
> "v1.0" scope = Risk Engine + ML = milestone **M1**; "v2.0" scope = Payment Gateway + Kafka = milestone **M2**.
> The website, authentication, LLM insights and AWS staging are the "v3.0" scope (milestones M0, M3, M4).
> The first product release tag, `v1.0.0`, is cut at milestone **M5**. Dates live only in `docs/ROADMAP.md`.

---

## 1. Summary & change log

### 1.1 Work to date

| Item | Status | Notes |
|---|---|---|
| Programme plan | ✅ Updated | Phase 1 + Phase 2 now delivered as **one upgraded project, "Sentinel Pay"**, in two releases. Cloud/AI SRE project remains Phase 3 |
| Tech direction | ✅ Agreed | Java 21 + Spring Boot 4, React (TypeScript), Python for ML, Maven, GitHub Actions, Jira Cloud; **Kafka added** in v2.0 |
| Sprint 1 plan (solo) | 📝 Written, not started | Folded into backend tickets RISK-10…12 |
| Risk Engine SDD v1.0 | ✅ Written | Three-person split, two contracts, two-week plan |
| Risk Engine API | ✅ 1.1.0 | Additive only: `paymentStatus`, `fraudConfirmed` |
| Payment Gateway | 🆕 Designed here | Built from scratch by Jiawei in Release 2 |

### 1.2 What changed from v1.0 to v2.0 of this document (historical)

1. **New component: Payment Gateway** (`payment-gateway/`, owner Jiawei Zhou) — merchant-facing payments API: authorise, capture, cancel, refund, idempotency, simulated acquirer, double-entry ledger (Should).
2. **Integration style:** the gateway calls the Risk Engine **synchronously over REST** before authorisation; both services publish **domain events to Kafka** via a transactional outbox.
3. **Two releases:** v1.0 (Risk Engine, unchanged scope, 16–29 Nov) then v2.0 (Gateway + integration, 30 Nov–13 Dec).
4. **Two new contracts:** `openapi-payment-gateway-v1.yaml`, `asyncapi-events-v1.yaml` (AsyncAPI 3.0).
5. **Risk Engine changes for v2.0:** publish `RiskAssessmentCreated/Reviewed`; consume payment events to show payment outcome and capture fraud feedback.
6. **Proposed Release 2 tasks for Jiajun and Zheng** (payments UI; ML feedback collector + retraining) — to confirm at the v2.0 kick-off (Q8).
7. Sections 1–4, 5.1, 5.4, 5.5, 6, 10–18 updated; Sections 7–9 unchanged for v1.0 with v2.0 additions appended (7.12, 8.7, 9.10).

### 1.3 What changed in v3.0 of this document

1. **New component: LLM Insights** (`llm-insights/`, proposed owner Zheng Liu) — an asynchronous, advisory step that writes a case summary for analysts. It never changes a payment or risk decision (Sections 4.8 and 13).
2. **Public website and web app** — the frontend grows from an analyst UI into a marketing site, an interactive sample, a merchant and analyst product area, role-based dashboards and an internal LLM Console (Section 8.8).
3. **Authentication and roles** — Amazon Cognito with four roles. Ops and analytics endpoints are no longer unauthenticated; merchants are provisioned on first login (Section 14).
4. **AWS staging environment** — ECS on a single EC2 Graviton host with scheduled start/stop, CloudFront, S3, Cognito and Bedrock; deployed only through the pipeline (Section 19, ADR-0007).
5. **Python services stay on FastAPI** — `ml-scorer` and the new `llm-insights` both use FastAPI. Django was evaluated and rejected on 11 Nov 2026 (ADR-0009).
6. **Frontend UI kit** — Tailwind CSS + shadcn/ui with our own design tokens, Motion, TanStack Table and Recharts replace MUI (Section 8.1, ADR-0010, decided 14 Nov 2026).
7. **Engineering process** — Conventional Commits, ADRs, three living documents, runbooks and an Operational Readiness Review (Section 5).
8. **Schedule and tracking setup moved** to `docs/ROADMAP.md`. Sections 13 and 14 of v2.0 (Schedule, Jira setup) are replaced here by the LLM Insights and Authentication designs.
9. **GitHub Issues and a GitHub Project replace Jira** as the backlog and sprint tool (`TECH_DECISIONS.md` D17). The `RISK-<n>` keys remain as backlog IDs.

Sections not listed above are carried over from v2.0 unchanged.

---

## 2. Overview

### 2.1 Problem

A merchant wants to take card payments without building payment processing or fraud prevention itself. **Sentinel Pay** gives merchants a payments API (like a simplified Stripe/Adyen) and screens every payment in real time with the **Sentinel Risk Engine**, which combines **deterministic rules** with a **machine-learning score** and routes doubtful payments to **human analysts**. Payment outcomes flow back to the Risk Engine as events, closing the loop between "what we predicted" and "what actually happened".

### 2.2 Goals

**Release 1 — v1.0 (Risk Engine)**

- G1: Score a transaction synchronously via REST with p95 latency < 250 ms locally.
- G2: Combine explainable Java rules with a Python ML score; every decision lists its reasons.
- G3: Keep working when the ML service is down (rules-only, flagged `degraded`).
- G4: Persist every assessment with a full audit trail.
- G5: Analyst web UI: dashboard, search, detail view, review queue, transaction simulator.
- G6: One command (`docker compose up`) runs the whole system.
- G7: Each component has automated tests and its own CI pipeline.

**Release 2 — v2.0 (Sentinel Pay)**

- G8: Merchants create, capture, cancel and refund payments through an idempotent REST API.
- G9: Every payment is risk-checked before authorisation; REVIEW payments are **held** and resumed or declined when an analyst decides.
- G10: Services exchange domain events through Kafka with **no lost or duplicated business effects** (outbox + idempotent consumers).
- G11: Money movements are recorded in a balanced **double-entry ledger** (Should).
- G12: Ops UI shows payments end to end, linked to their risk assessments.

**v3.0 scope — platform, website and AI insight**

- G13: Every REVIEW case gets an **AI-generated, advisory** case summary for the analyst. The LLM never approves, declines or changes a decision, and the platform behaves identically when the LLM step is down.
- G14: A public website explains the product and lets a visitor run an interactive sample with no login, no backend and no cost.
- G15: Users sign in through Cognito. Merchants, analysts, admins and developers see only what their role allows, and a merchant sees only its own data.
- G16: The whole platform runs in one AWS staging environment for roughly $20–28 a month and is deployed only through the CI/CD pipeline.
- G17: Developers can inspect every LLM call (prompt, response, tokens, cost, feedback) in an internal console.
- G18: The project is run the way an enterprise team would run it: design reviews, ADRs, small reviewed PRs, runbooks and an Operational Readiness Review before release.

### 2.3 Non-goals

- Real card data or a real acquirer/card network. Cards are **test tokens**; the acquirer is **simulated**. **No PAN is ever accepted or stored**, which keeps the system out of PCI DSS scope (state this in the README).
- An LLM that makes or changes decisions. The LLM step is advisory only.
- Personal data in LLM prompts: no names, emails or card data. IDs are pseudonymous.
- A production AWS environment. There is one environment, staging. Fargate + ALB + Multi-AZ RDS is the documented migration path, not the current build (Section 19.5).
- High availability. The staging host is a single EC2 instance with brief downtime on every deploy.
- A custom domain and TLS between CloudFront and the origin (upgrade path).
- 3-D Secure / SCA, webhooks, settlement files, multi-currency FX (roadmap, Section 17).
- Kubernetes.
- Real fraud data — ML is trained on clearly labelled synthetic data plus feedback events from the demo.

### 2.4 Scope (MoSCoW)

| Priority | Risk Engine backend (Jiawei) | Payment Gateway (Jiawei) | Frontend (Jiajun) | ML (Zheng) |
|---|---|---|---|---|
| **Must** | v1.0 scope (Section 7); v2.0: outbox + risk events, consume payment events | Create/get payment, risk check + fallback, simulated acquirer, capture, cancel, refund, Idempotency-Key, state machine, outbox, consume review events, review timeout | v1.0 scope (Section 8) | v1.0 scope (Section 9) |
| **Should** | Blocklist CRUD, seed data | Double-entry ledger, ops stats endpoint | Blocklist page; v2.0 payments list/detail, demo checkout | Explanations, model card; v2.0 feedback collector |
| **Could** | Prometheus metrics | Kafka UI in compose, DLT replay tool | CSV export, dark mode | Retraining with feedback, drift report |
| **Won't (first release)** | Redis | Webhooks, 3DS, settlement | Offline support, native mobile app | SHAP, model registry |

**v3.0 scope (Proposed — to confirm with the milestone sign-off issue)**

| Priority | LLM Insights (Zheng, proposed) | Website & web app (Jiajun) | Authentication (Jiawei, Jiajun) | AWS & CI/CD (Jiawei) |
|---|---|---|---|---|
| **Must** | Consume `RiskAssessmentCreated`; insight for every REVIEW; `StubProvider` + `BedrockProvider`; output validation; timeout, retries, token limits, daily budget; idempotent on `assessmentId`; insight and invocation read APIs | Homepage, `/sample`, `/product`, role-based `/dashboard`, login redirect, "environment is sleeping" banner, footer disclaimer | Cognito user pool and groups; Authorization Code + PKCE login; JWT validation in every backend; merchant provisioning; tenant scoping (404) | Terraform staging; single ECS host; ECR; CloudFront + S3; deploy pipeline with approval gate; AWS Budgets alerts; scheduled start/stop |
| **Should** | Sampling of APPROVE/DECLINE cases; feedback endpoint; stats endpoint; `RiskInsightGenerated` event | `/pricing`, `/about`, LLM Console (overview, table, detail), AI summary on the assessment detail | — | CloudWatch alarms and dashboard; nightly `pg_dump`; DLM snapshots |
| **Could** | Prompt comparison metrics | `/docs` rendered from OpenAPI; prompt comparison view | — | ECS Service Connect |
| **Won't** | LLM-made decisions, fine-tuning, retrieval (RAG) | Copies of any third-party brand assets | A local identity provider | Production environment, custom domain, Multi-AZ |

---

## 3. Team & ownership

### 3.1 Responsibilities

| Area | Owner (R/A) | Consulted | Informed |
|---|---|---|---|
| Overall architecture, repo, CI, project board, releases | **Jiawei Zhou** | Jiajun, Zheng | — |
| Risk Engine service (`backend/`), Java rules, risk database | **Jiawei Zhou** | Zheng (features), Jiajun (API shape) | — |
| **Payment Gateway (`payment-gateway/`), gateway database, ledger** | **Jiawei Zhou** | Jiajun (ops API shape) | Zheng |
| **Kafka topics & event contract (`asyncapi-events-v1.yaml`)** | **Jiawei Zhou** | Zheng (consumer) | Jiajun |
| Risk Engine API contract | **Jiawei Zhou** (producer) | **Jiajun Xiao** (consumer, must approve changes) | Zheng |
| **Gateway API contract** | **Jiawei Zhou** (producer) | **Jiajun Xiao** (consumer of ops endpoints, must approve changes) | Zheng |
| Frontend (`frontend/`) | **Jiajun Xiao** | Jiawei | Zheng |
| ML scorer (`ml-scorer/`), data, model, feedback collector | **Zheng Liu** | Jiawei | Jiajun |
| ML contract | **Zheng Liu** (producer) | **Jiawei Zhou** (consumer, must approve changes) | Jiajun |
| docker-compose & end-to-end demo | **Jiawei Zhou** | Jiajun, Zheng | — |
| **LLM Insights (`llm-insights/`), prompts, `llm` database** | **Zheng Liu** (proposed — confirm via issue) | Jiawei (events, risk API), Jiajun (console API shape) | — |
| **LLM Insights API contract** | **Zheng Liu** (producer, proposed) | **Jiajun Xiao** (consumer, must approve changes) | Jiawei |
| **AWS infrastructure (`infra/`), CI/CD pipelines, releases** | **Jiawei Zhou** | Jiajun, Zheng | — |
| **Cognito user pool, roles, JWT validation** | **Jiawei Zhou** | Jiajun (login flow) | Zheng |

> ⚠️ Jiawei owns three services' worth of backend work plus tech lead duties. Section 16 lists the mitigation (drop order and hand-over candidates).

### 3.2 Hand-off points

Dates for every hand-off are in `docs/ROADMAP.md`; this table defines what is handed over.

| # | From → To | What | Milestone |
|---|---|---|---|
| H0 | Jiawei → All | Walking skeleton: one hello-world service and the frontend shell deployed to AWS through the full pipeline | M0 |
| H1 | All | Risk Engine + ML contracts reviewed and **frozen** | M1 |
| H2 | Zheng → Jiawei | ML scorer Docker image runs locally with a trained model | M1 |
| H3 | Jiawei → Jiajun | Risk Engine running in docker-compose with seed data | M1 |
| H4 | Jiawei → Zheng | Real customer-context values from the DB (feature parity check) | M1 |
| H5 | All | Risk Engine end-to-end scenarios E1–E9 pass | M1 |
| H6 | All | Gateway API + event contract reviewed and **frozen** | M2 |
| H7 | Jiawei → Jiajun | Gateway running in compose with seed merchants and payments | M2 |
| H8 | Jiawei → Zheng | `payments.events.v1` publishing real events (for the feedback collector) | M2 |
| H9 | All | Payment end-to-end scenarios P1–P14 pass | M2 |
| H10 | Jiawei → Jiajun | Cognito user pool, app client and one test user per role | M3 |
| H11 | All | LLM Insights API and `risk.insights.v1` reviewed and **frozen** | M4 |
| H12 | Jiawei → Zheng | `risk.assessments.v1` publishing real `RiskAssessmentCreated` events; Bedrock model access enabled in the AWS account | M4 |
| H13 | Zheng → Jiajun | `llm-insights` running in compose with `StubProvider` and seeded invocations | M4 |

Before each hand-off, consumers work against **mocks generated from the contracts** (WireMock, MSW, or a local Kafka with sample events from `e2e/events/`).

---

## 4. Architecture

### 4.1 System context (local stack)

```text
                ┌─────────────────────────────────── docker-compose network ───────────────────────────────────┐
                │                                                                                              │
 Merchant ─REST─┼──▶ payment-gateway (:8080) ──sync REST (300 ms)──▶ risk-engine (:8081) ──REST (200 ms)──▶ ml-scorer (:8000)
 (Postman /     │      │  X-API-Key, Idempotency-Key      ▲              │                                    │       │
  demo checkout)│      │                                   │              │                                    │       │
                │      ▼ JDBC                              │              ▼ JDBC                               │       │
                │   PostgreSQL db "gateway"                │        PostgreSQL db "sentinel"                   │       │
                │      │ outbox                            │              │ outbox                             │       │
                │      ▼                                   │              ▼                                    │       │
                │   ┌──────────────────────── Kafka (KRaft, :9092) ─────────────────────────┐                  │       │
                │   │  payments.events.v1  ───────────────▶ risk-engine, ml-scorer feedback │◀─────────────────┘       │
                │   │  risk.assessments.v1 ───────────────▶ payment-gateway                 │                          │
                │   └────────────────────────────────────────────────────────────────────────┘                          │
                │                                                                                              │
 Analyst ─browser──▶ frontend (nginx :3000)  /api/v1/payments, /api/v1/ops/** → gateway · other /api/** → risk-engine │
                └──────────────────────────────────────────────────────────────────────────────────────────────┘
```

**Why sync + async?** The authorisation decision must be made while the merchant waits, so the risk check is a **synchronous** call. Everything that can happen later — recording outcomes, resuming held payments, collecting fraud labels — goes through **Kafka**, so a slow or restarting consumer never blocks a payment. (ADR-004.)

**v3.0 additions.** The decision path above does not change. One asynchronous consumer and two managed services are added:

```text
Merchant/App ──▶ payment-gateway ──sync REST──▶ risk-engine ──REST──▶ ml-scorer
                     │  (decision returned, payment continues — unchanged)
                     │
                     ▼ outbox → Kafka
     payments.events.v1          risk.assessments.v1 ──▶ llm-insights  (:8001, async)
                                                            │ prompt → LLM (Bedrock, or Stub locally) → validated JSON
                                                            ├─▶ PostgreSQL db "llm": llm_invocation, insight_feedback
                                                            └─▶ Kafka: risk.insights.v1

Browser ──▶ frontend ── login ──▶ Amazon Cognito (Authorization Code + PKCE)
              │  Bearer JWT on every /api call ──▶ payment-gateway · risk-engine · llm-insights
              ├─ Review queue / assessment detail: LLM case summary, labelled "AI-generated, advisory"
              └─ /internal/llm: LLM Console (developer / admin)
```

The staging deployment of this system (CloudFront, S3, one ECS host) is in Section 19.

### 4.2 Component summary

| Component | Owner | Tech | Port | Responsibility |
|---|---|---|---|---|
| `payment-gateway` | Jiawei | Java 21, Spring Boot 4.1.x, Spring for Apache Kafka | 8080 | Merchant API, payment lifecycle, idempotency, risk check, acquirer simulation, ledger, outbox |
| `risk-engine` | Jiawei | Java 21, Spring Boot 4.1.x | 8081 | Risk API, rules, context features, ML orchestration, decisions, audit, risk events |
| `ml-scorer` | Zheng | Python 3.12, FastAPI, scikit-learn, uv | 8000 | Fraud probability + explanation; feedback collector (`ml-feedback`, no port) |
| `frontend` | Jiajun | React 19, TypeScript, Vite, TanStack Query; UI kit: Tailwind CSS + shadcn/ui with own design tokens (ADR-0010; was MUI) | 5173 dev / 3000 docker | Public website, merchant and analyst web app, LLM Console |
| `postgres` | Jiawei | PostgreSQL 18 | 5432 | Databases `sentinel` (risk), `gateway` and `llm` — **one database per service** |
| `kafka` | Jiawei | Apache Kafka 4.x, KRaft mode (no ZooKeeper) | 9092 | Event backbone |
| `kafka-ui` (Could) | Jiawei | kafbat/kafka-ui | 8085 | Inspect topics during demos |
| `llm-insights` | Zheng (proposed) | Python 3.12, FastAPI, SQLAlchemy + Alembic, boto3 (Bedrock), Pydantic v2, uv | 8001 | Advisory case summaries for analysts; LLM invocation log, stats and feedback |
| Amazon Cognito | Jiawei | Managed user pool (one shared dev/staging pool) | — | Sign-up, login and roles (groups) |
| Amazon Bedrock | Jiawei | Managed LLM API (Converse) | — | Inference for `llm-insights` in staging; local development and CI use `StubProvider` |

**Database per service:** the gateway never reads the risk database and vice versa. They share only **contracts** (REST + events), never tables or Java code. This keeps services independently deployable — a standard microservices rule worth stating in interviews.

### 4.3 Assessment flow (happy path)

```text
Client            risk-engine                                   PostgreSQL          ml-scorer
  │ POST /risk-assessments │                                         │                   │
  │───────────────────────▶│ 1. validate request (Bean Validation)   │                   │
  │                        │ 2. idempotency lookup by transactionId ─▶│                   │
  │                        │ 3. build CustomerContext (history) ─────▶│                   │
  │                        │ 4. run Java rules  → ruleScore, ruleHits │                   │
  │                        │ 5. POST /v1/score (context + txn) ───────────────────────────▶│
  │                        │◀────────────────────── score, factors, modelVersion ──────────│
  │                        │ 6. combine scores → riskScore, decision  │                   │
  │                        │ 7. save assessment + ASSESSED audit ────▶│ (one transaction) │
  │◀─── 200 RiskAssessment │                                          │                   │
```

**Degraded path:** if step 5 times out, returns non-2xx, or the circuit breaker is open → `mlScore = null`, `degraded = true`, reason `ML_UNAVAILABLE`, decision from rules only. Decision: **fail-open to rules**, not fail-closed — declining every payment when one internal service is down is worse for the business than relying on rules for a short period. (Record this in ADR-003.)

### 4.4 Scoring model (shared contract between Backend and ML)

```text
ruleScore   = min(100, Σ scoreImpact of matched rules)
mlScore     = ml-scorer.score                       (0–100, or null if degraded)

if any rule has hardDecline = true:   riskScore = 100, decision = DECLINE
else if mlScore is null:              riskScore = ruleScore
else:                                 riskScore = round(0.5 × ruleScore + 0.5 × mlScore)

decision = APPROVE  if riskScore < 40
           REVIEW   if 40 ≤ riskScore < 70
           DECLINE  if riskScore ≥ 70

Escalation: if decision = APPROVE but ruleScore ≥ 80 or mlScore ≥ 80 → REVIEW
            (one strong signal should never be averaged away silently)
```

Weights and thresholds live in `application.yml` (`risk.scoring.*`) so they can be tuned without code changes.

| Decision | Status after assessment | Reason codes added |
|---|---|---|
| APPROVE | `AUTO_DECIDED`, `finalDecision = APPROVE` | rule codes |
| REVIEW | `PENDING_REVIEW`, `finalDecision = null` | rule codes, `ML_HIGH_RISK` if mlScore ≥ 70 |
| DECLINE | `AUTO_DECIDED`, `finalDecision = DECLINE` | rule codes, `ML_HIGH_RISK` if mlScore ≥ 70 |
| any + degraded | as above | `ML_UNAVAILABLE` |

### 4.5 Payment flow (v2.0, automatic capture)

```text
Merchant        payment-gateway                         risk-engine          SimulatedAcquirer     Kafka
   │ POST /payments (Idempotency-Key)                        │                     │                 │
   │────────────────▶│ 1. auth API key, validate             │                     │                 │
   │                 │ 2. idempotency check (merchant, key)  │                     │                 │
   │                 │ 3. TX-A: insert payment RISK_CHECKING │                     │                 │
   │                 │ 4. POST /api/v1/risk-assessments ────▶│ (rules + ML)        │                 │
   │                 │◀──────────────── decision, score ─────│                     │                 │
   │                 │    APPROVE ↓   REVIEW → 4.6   DECLINE → status DECLINED + outbox PaymentDeclined
   │                 │ 5. TX-B: status AUTHORIZING           │                     │                 │
   │                 │ 6. authorize(token, amount) ──────────────────────────────▶│                 │
   │                 │◀───────────────────────────── approved, authCode ──────────│                 │
   │                 │ 7. TX-C: AUTHORIZED → CAPTURED, ledger entries,           │                 │
   │                 │         outbox PaymentAuthorized + PaymentCaptured        │                 │
   │◀── 201 Payment (CAPTURED)                               │                     │                 │
   │                 │ 8. OutboxPublisher (async) ─────────────────────────────────────────────────▶│ payments.events.v1
   │                 │                                       │◀── consume: paymentStatus = CAPTURED ─│
```

**Rule:** never hold a database transaction open across an HTTP call. Each `TX-x` is short; state between them is persisted, so a crash leaves a payment in a known intermediate status that a recovery job can resolve (Section 10.8).

### 4.6 Held payment flow (risk decision = REVIEW)

```text
payment-gateway                        Kafka                    risk-engine                 Analyst (UI)
 │ status PENDING_RISK_REVIEW            │                          │                            │
 │ 201 to merchant (status = PENDING_RISK_REVIEW)                   │                            │
 │                                       │                          │◀── POST …/review APPROVE ──│
 │                                       │◀─ RiskAssessmentReviewed ─│ (outbox)                   │
 │◀──── consume (group gateway.risk-events)                         │                            │
 │ dedupe eventId → AUTHORIZING → acquirer → AUTHORIZED/CAPTURED → outbox events                 │
 │                                                                                               │
 │ ReviewTimeoutJob (every 60 s): PENDING_RISK_REVIEW older than 30 min → DECLINED (RISK_REVIEW_TIMEOUT)
```

- Review **DECLINE** → payment `DECLINED` with `RISK_REVIEW_REJECTED`.
- A review event that arrives **after** the timeout is ignored by the state machine (logged at WARN); the Risk Engine still learns the real outcome from `PaymentDeclined`.
- The merchant learns the final status by polling `GET /payments/{id}` (webhooks in v2.1).

### 4.7 Risk Engine unavailable — gateway fallback policy (ADR-005)

| Condition | Gateway behaviour |
|---|---|
| Risk call times out (300 ms), returns 5xx, or circuit breaker open | Apply fallback policy |
| Amount ≤ fallback limit (EUR 100 · GBP 85 · USD 110, configurable) | Continue to acquirer; `risk.fallbackApplied = true` |
| Amount > fallback limit | `DECLINED`, reason `RISK_UNAVAILABLE` |
| Risk returns 4xx (bad request) | `FAILED` — this is a bug, alert on it |

Low-value payments keep flowing (good customer experience); high-value payments are protected. Compare with the Risk Engine's own ML fallback (Section 4.3), which is fail-open to rules — two layers, two deliberate policies.

### 4.8 LLM insight flow (v3.0 — asynchronous, advisory)

```text
risk-engine              Kafka                      llm-insights                         LLM provider       Analyst (UI)
 │ assessment + outbox row │                             │                                    │                  │
 │── RiskAssessmentCreated ─▶ risk.assessments.v1        │                                    │                  │
 │                         │── consume ─────────────────▶│ 1. already handled this assessmentId? → skip          │
 │                         │                             │ 2. select: REVIEW always; APPROVE/DECLINE sampled     │
 │                         │                             │ 3. daily budget exceeded? → stop, publish nothing     │
 │◀── GET /api/v1/risk-assessments/{id} ─────────────────│ 4. fetch details (amounts, rule hits, ML factors)     │
 │                         │                             │ 5. render prompt <name>/v<N> ─────▶│                  │
 │                         │                             │◀── text + token usage ─────────────│ 10 s, 2 retries  │
 │                         │                             │ 6. validate JSON (Pydantic) → SUCCESS | INVALID_OUTPUT│
 │                         │                             │ 7. save llm_invocation (prompt, response, cost)       │
 │                         │◀── RiskInsightGenerated ────│ 8. publish on risk.insights.v1 (SUCCESS only)         │
 │                         │                             │◀── GET /api/v1/insights/{assessmentId} ───────────────│
```

- The payment and risk decision is **already final** before step 1. Nothing on the decision path waits for, or reads, an insight.
- If the provider is down, slow or over budget, the analyst simply sees "No AI summary available". Payments and reviews continue (scenario L3).
- Design details are in Section 13.

### 4.9 Deployment views

| View | Where | Notes |
|---|---|---|
| Local | `docker compose` (Sections 4.1 and 12.1) | All services on one Docker network; LLM uses `StubProvider`; login uses the shared Cognito pool |
| Staging | AWS eu-north-1 (Section 19, ADR-0015) | CloudFront + S3 for the frontend; one EC2 host running every backend container under ECS; on a weekday schedule |
| Production | Not built | Migration path documented in Section 19.5 |

---

## 5. Shared engineering conventions

### 5.1 Repository layout

```text
sentinel-pay/                     # repository name today: SentinelRiskEngine (Q6)
├── CLAUDE.md                     # working agreement for AI-assisted development
├── backend/                      # Risk Engine — Java 21, Spring Boot 4, Maven          — @AlbertChow1997
├── payment-gateway/              # Payment Gateway — Java 21, Spring Boot 4, Spring Kafka — @AlbertChow1997
├── ml-scorer/                    # ML scoring — Python 3.12, FastAPI, scikit-learn, uv  — Zheng Liu
├── llm-insights/                 # LLM insight service — Python 3.12, FastAPI, boto3    — Zheng Liu (proposed)
├── frontend/                     # Website + web app — React 19, TypeScript, Vite       — Jiajun Xiao
├── contracts/                    # OpenAPI + AsyncAPI contracts (shared, CODEOWNERS-protected)
├── infra/
│   ├── terraform/
│   │   ├── modules/              # network, ecs-ec2-host, ecs-service, ecr, cdn, cognito, scheduler, observability, github-oidc
│   │   └── envs/staging/         # the one AWS environment
│   └── scripts/                  # aws-wake.sh / aws-sleep.sh / aws-status.sh
├── docs/
│   ├── DESIGN.md                 # this document
│   ├── ROADMAP.md                # schedule and progress
│   ├── TECH_DECISIONS.md         # technology comparisons + ADR index
│   ├── adr/                      # one file per decision: NNNN-title.md
│   ├── runbooks/                 # how to operate and recover each service; ORR checklist
│   ├── postmortems/              # blameless post-incident reviews
│   └── threat-model.md           # STRIDE threat model
├── docker/postgres/init/         # creates the per-service databases for local development
├── e2e/                          # Postman/Newman collections, Playwright UI tests, sample events
├── docker-compose.yml            # local stack
├── Makefile                      # one entry point for common commands
└── .github/
    ├── CODEOWNERS
    ├── pull_request_template.md
    ├── ISSUE_TEMPLATE/           # bug, question, decision, task
    ├── dependabot.yml
    └── workflows/                # ci-*.yml per component, contracts.yml, codeql.yml, terraform.yml, deploy-staging.yml
```

Each component folder has a `README.md` and its own `CLAUDE.md` with stack-specific commands and conventions.

**`.github/CODEOWNERS`** maps each folder to its owner and each contract to its producer **and** consumers. A code owner must have write access to the repository, so the lines for Jiajun (`@jiajunxiao-work`) and Zheng (`@zliu-59`) take effect once they accept their invitations.

> Because Jiawei owns both Java services, PRs on `backend/` and `payment-gateway/` still need **one approval from Jiajun or Zheng** — a second pair of eyes on readability and tests, even if they are not Java experts. Ask the reviewer to focus on tests, naming and the PR description.

### 5.2 Branching & commits

- Trunk-based: `main` is always releasable; short-lived branches `feature/RISK-<n>-short-name`, `fix/RISK-<n>-…`, `chore/…`, `docs/…`.
- One issue → one branch → one PR. The PR says `Closes #<issue>`.
- Commit messages follow **Conventional Commits** with the backlog ID: `feat(gateway): RISK-73 add idempotency key replay`. (Design v2.0 used `RISK-<n>: summary`; this replaces it.)
- Rebase on `main` before opening a PR; squash-merge; no force-push to `main`.
- Releases are semantic version tags `vX.Y.Z` with generated release notes and `CHANGELOG.md`.

### 5.3 Pull requests & code review

- Every PR needs **one approval from another team member** (CODEOWNERS enforces owner approval).
- Reviewer turnaround target: **24 hours**. The author resolves every comment or explains why not.
- PR size target: < 400 changed lines (excluding generated code and lockfiles). Do not mix refactors with features.
- The PR template asks for: the linked issue, what/why, how it was tested, screenshots for UI changes, risk and rollback plan, docs updated?, contract changed?, **AI assistance used (which parts)**.
- No PR without tests for new behaviour.

### 5.4 Contract change process

1. Open a PR that changes only the file in `contracts/`.
2. Producer **and** consumer approve.
3. Additive changes (new optional field, new endpoint) → allowed any time.
4. Breaking changes (rename/remove field, change type) → **not allowed after a contract is frozen** (H1 for v1.0 contracts, H6 for v2.0 contracts); go to `/api/v2` or wait for the next minor release.
5. Event contract (`asyncapi-events-v1.yaml`): same process, plus the event-versioning rules in Section 6.5.

### 5.5 CI/CD (GitHub Actions)

Backend CI always reports its stable check, then uses internal path detection to run Maven only for relevant changes.
Other component workflows currently use workflow-level path filters. Do not make a path-filtered check required until
an always-reporting gate exists, or unrelated PRs will wait indefinitely for a check that never starts.

| Workflow | Trigger | Steps | Status |
|---|---|---|---|
| `ci-backend.yml` | Every PR/main push; internal backend/contracts/CI path gate; manual always verifies | Stable check, change-detection tests, Java 21 Maven verify when relevant; dependency/Wrapper caches, reports (14 days); main runs preserved | RISK-12; current M0 tests need no Docker |
| `ci-gateway.yml` | PR / push touching the folder or `contracts/` | `./mvnw -B verify` (unit + PostgreSQL 18/Kafka Testcontainers), JaCoCo coverage report | With the gateway scaffold |
| `ci-ml.yml`, `ci-llm.yml` | same | `uv sync`, `ruff check`, `ruff format --check`, `mypy`, `pytest` (`StubProvider` only, no cloud calls) | With each scaffold PR |
| `ci-frontend.yml` | same | `npm ci`, lint, typecheck, unit tests, build, Playwright smoke against the preview build | With the scaffold PR |
| `contracts.yml` | changes in `contracts/` | Validate OpenAPI (Redocly) and AsyncAPI (AsyncAPI CLI); detect breaking changes (`oasdiff`) | **Exists** |
| `codeql.yml` | PR + weekly | CodeQL for Java, Python, JavaScript/TypeScript and workflow files; a language starts analysing when its first source file lands | **Exists**, but skipped while the repository is private: code scanning there needs GitHub Advanced Security |
| `terraform.yml` | changes in `infra/` | `terraform fmt -check`, `validate`, `tflint`, `checkov`/`trivy config`, `plan` posted as a PR comment | M0 |
| `deploy-staging.yml` | Manual on main, explicit DEPLOY_STAGING, enabled only after real reviewer/main-only gate exists | Build/test **ARM64** images and frontend → Trivy scan → **approval gate** (GitHub Environment `staging`, required non-self reviewer) → AWS credentials through **GitHub OIDC** → ECR publication (immutable git SHA; tasks use digest) → start the EC2 host if stopped and wait for ECS → register task definitions and update services (circuit-breaker rollback) → frontend build → S3 sync → CloudFront invalidation → smoke test through the CloudFront URL | M0 |

- **CI never calls paid external APIs.** LLM tests use `StubProvider`; AWS calls are stubbed (moto or a stubbed boto3 client).
- **Dependabot** covers GitHub Actions and docker-compose now; Maven, uv, npm, Docker and Terraform are enabled as each manifest appears.
- **Branch ruleset on `main`:** PR required, 1 approval, code-owner review, all required checks green, linear history (squash merge), no force-push. Path-filtered workflows that do not run must not block merging — verify this when the ruleset is created. The repository is private: check that the GitHub plan in use supports rulesets, required code-owner review and environment reviewers on private repositories before relying on them (Q21).

### 5.6 Definition of Done (team-wide)

1. Acceptance criteria met; issue linked to the PR.
2. Tests added or updated; CI green; coverage not reduced on core packages.
3. Reviewed and approved by another team member.
4. Contracts, `DESIGN.md`, `ROADMAP.md`, `TECH_DECISIONS.md` and runbooks updated where relevant.
5. No secrets, personal data or card data; no new high/critical findings from CodeQL or Trivy.
6. Deployed to staging and smoke-tested (once the deploy pipeline exists).

### 5.7 Communication

| Ceremony | When | Length | Notes |
|---|---|---|---|
| Sprint planning | Start of each one-week sprint | 30 min | Pull issues from the project backlog into the iteration; update `docs/ROADMAP.md` |
| Async stand-up | Daily | 3 lines | Yesterday / today / blockers in the team chat |
| Sync check-in | Mid-sprint | 30 min | Integration risks and hand-offs first |
| Sprint review + demo | End of each sprint | 30–45 min | Demo scripts in Section 12.4 |
| Design review | When a `DESIGN.md` change PR is opened | async, then 30 min if needed | Required before implementing a new component or a significant change |
| Retrospective | At each milestone | 30 min | What to keep / change |

Concrete dates are in `docs/ROADMAP.md`. Technical questions, decisions, bugs and blockers and the backlog itself are all **GitHub Issues**, planned on the GitHub Project "Sentinel Pay" (setup in `docs/ROADMAP.md` §8).

### 5.8 AI-assisted development policy

AI tools (Claude, Copilot, etc.) are encouraged for scaffolding, boilerplate, tests and debugging. Rules:

1. **You own every line you merge.** You must be able to explain it in review and in an interview.
2. Generate from the **contract and this document** — paste the relevant OpenAPI schema into the prompt so generated code matches field names exactly.
3. AI-written code needs the **same tests** as hand-written code; ask the AI for tests, then read them critically.
4. Never paste secrets, tokens or personal data into prompts.
5. Tick "AI assistance used" in the PR template and name the parts (e.g. "MSW handlers generated, reviewed and edited").
6. Check library versions the AI suggests against official docs — AI tools often produce Spring Boot 3 or older React APIs.

### 5.9 Design before build

- New components and significant changes need a design section in this document, reviewed through a PR, **before** implementation.
- Each technology choice gets an ADR (`docs/adr/NNNN-title.md`: Context, Options, Decision, Consequences) and a row in `docs/TECH_DECISIONS.md`.
- Customer-facing features start from the customer: add a short **Working Backwards** paragraph (Amazon PR/FAQ style) at the top of the feature's design section — who the customer is, their problem, and how this solves it.
- Security: update `docs/threat-model.md` (STRIDE) when adding an entry point, a data store or an external dependency (Microsoft SDL).
- Unclear or blocked? Raise a GitHub issue with the template in `.github/ISSUE_TEMPLATE/`; do not guess.

### 5.10 Operational excellence

- Each service exposes health endpoints, emits structured JSON logs with `X-Request-Id`, and has at least one CloudWatch alarm.
- Each service has a runbook in `docs/runbooks/<service>.md`: purpose, dependencies, dashboards, alarms, common failures and fixes, how to roll back.
- An **Operational Readiness Review** checklist (`docs/runbooks/orr-checklist.md`) must pass before each release.
- Incidents and major bugs get a blameless post-incident review in `docs/postmortems/`.

## 6. Interface contracts (summary)

Full definitions are in `contracts/`. OpenAPI files target OpenAPI 3.1; the event file targets AsyncAPI 3.0. The Risk Engine and Gateway contracts were imported from design v2.0. The ML contract was added in RISK-140. RISK-100 now drafts the LLM Insights contract (Section 6.6) and an additive insights event for producer/consumer review. Gateway/risk JWT and merchant provisioning are now drafted in RISK-100 (Section 6.7); all drafts await producer/consumer approval.

### 6.1 Risk Engine API (1.1.0) — producer Risk Engine, consumers Frontend & Gateway

| Method | Path | Purpose | Priority |
|---|---|---|---|
| POST | `/api/v1/risk-assessments` | Assess a transaction (idempotent on `transactionId`) | Must |
| GET | `/api/v1/risk-assessments` | Search (filters: decision, status, customerId, minScore, from, to; paging; sort) | Must |
| GET | `/api/v1/risk-assessments/{id}` | Detail | Must |
| POST | `/api/v1/risk-assessments/{id}/review` | Analyst decision on a `PENDING_REVIEW` case | Must |
| GET | `/api/v1/risk-assessments/{id}/audit-events` | Audit trail | Must |
| GET | `/api/v1/stats/summary` | Dashboard KPIs + score histogram | Must |
| GET/POST/DELETE | `/api/v1/blocklist[/{id}]` | Manage blocklist | Should |
| GET | `/actuator/health` | Health | Must |

### 6.2 Internal ML API — producer ML, consumer Backend

| Method | Path | Purpose |
|---|---|---|
| POST | `/v1/score` | Score one transaction (stateless; backend sends `customerContext`) |
| GET | `/health` | `{status, modelLoaded}` |
| GET | `/v1/model-info` | Version, algorithm, features, metrics, training-data label |

### 6.3 Error handling contract

- Public API: RFC 9457 Problem Details; extra `code` field for business errors (`IDEMPOTENCY_CONFLICT`, `INVALID_STATUS_TRANSITION`, `DUPLICATE_BLOCKLIST_ENTRY`); `errors` map for validation.
- ML API: FastAPI default 422 for validation; 503 if model not loaded. Backend treats **any** non-2xx or timeout as ML unavailable.
- Correlation: `X-Request-Id` accepted/generated by backend, logged in every component, forwarded to ML, echoed to the client.

### 6.4 Payment Gateway API — producer Gateway, consumers merchants & Frontend (v2.0)

| Method | Path | Auth | Purpose | Priority |
|---|---|---|---|---|
| POST | `/api/v1/payments` | API key + Idempotency-Key | Create & authorise (auto or manual capture) | Must |
| GET | `/api/v1/payments` | API key | Merchant's payments (paged) | Must |
| GET | `/api/v1/payments/{id}` | API key | Payment | Must |
| POST | `/api/v1/payments/{id}/capture` | API key + Idempotency-Key | Full/partial capture of AUTHORIZED | Must |
| POST | `/api/v1/payments/{id}/cancel` | API key + Idempotency-Key | Void AUTHORIZED / PENDING_RISK_REVIEW | Must |
| POST | `/api/v1/payments/{id}/refunds` | API key + Idempotency-Key | Full/partial refund | Must |
| GET | `/api/v1/ops/payments` | JWT (`analyst` / `admin`) — *was unauthenticated in v2.0* | Search all payments (ops UI) | Must |
| GET | `/api/v1/ops/payments/{id}` | JWT (`analyst` / `admin`) | Detail + status history + refunds + ledger | Must |
| GET | `/api/v1/ops/stats/summary` | JWT (`analyst` / `admin`) | Payment KPIs | Should |
| POST | `/api/v1/merchants/me` | JWT (`merchant`) — *new in v3.0* | Create or return the merchant record linked to the caller's Cognito `sub` | Must |

Business error codes: `IDEMPOTENCY_KEY_REUSED`, `IDEMPOTENCY_REQUEST_IN_PROGRESS`, `MISSING_IDEMPOTENCY_KEY`, `INVALID_PAYMENT_STATE`, `CAPTURE_EXCEEDS_AUTHORIZED`, `REFUND_EXCEEDS_CAPTURED`.

### 6.5 Domain events — Kafka (v2.0)

| Topic | Producer | Events | Consumers (group) |
|---|---|---|---|
| `payments.events.v1` | payment-gateway | `PaymentAuthorized`, `PaymentDeclined`, `PaymentCaptured`, `PaymentCanceled`, `PaymentRefunded` | risk-engine (`risk-engine.payment-events`), ml-scorer (`ml-scorer.feedback`, optional) |
| `risk.assessments.v1` | risk-engine | `RiskAssessmentCreated`, `RiskAssessmentReviewed` | payment-gateway (`gateway.risk-events`), llm-insights (`llm-insights.assessments`, proposed name) |
| `risk.insights.v1` *(new in v3.0)* | llm-insights | `RiskInsightGenerated` | none required; available to the frontend backend-for-frontend or analytics later |
| `<topic>.dlt` | consumers' error handler | failed messages after retries | manual inspection |

Envelope: `eventId`, `eventType`, `eventVersion`, `occurredAt`, `source`, `correlationId`, `data`. Message key = `paymentId` (= `transactionId`). Details in Section 11 and `asyncapi-events-v1.yaml`.

**Event contract rules:** adding an optional field = allowed; removing/renaming a field or changing meaning = new `eventVersion` **and** consumers updated first, or a new topic `.v2`. Consumers must **ignore unknown fields** (Jackson `FAIL_ON_UNKNOWN_PROPERTIES=false`, Pydantic `extra="ignore"`).

### 6.6 LLM Insights API — producer LLM Insights, consumer Frontend (v3.0)

Drafted in `contracts/openapi-llm-insights-v1.yaml` under RISK-100 **before** implementation: producer/consumer review
is required. It defines the five operations below, role metadata, Problem Details and invocation/feedback/statistics shapes.
`risk.insights.v1` now has an additive identifier-only `RiskInsightGenerated` contract. Q12 (Risk Engine service access, explicitly deferred to RISK-111),
Q13 (LLM ownership/process) and Q14 (persistence/budget-skip storage) remain open; no implementation is implied.

| Method | Path | Auth | Purpose | Priority |
|---|---|---|---|---|
| GET | `/api/v1/insights/{assessmentId}` | JWT (`analyst` / `admin`) | Latest valid insight for an assessment; 404 when none exists | Must |
| GET | `/api/v1/llm/invocations` | JWT (`developer` / `admin`) | Paged list with filters (status, model, prompt version, date range, assessment) | Must |
| GET | `/api/v1/llm/invocations/{id}` | JWT (`developer` / `admin`) | One invocation: rendered prompt, raw response, parsed output, validation errors, feedback | Must |
| GET | `/api/v1/llm/stats` | JWT (`developer` / `admin`) | Calls, success / invalid / error rates, latency percentiles, tokens, cost, feedback ratio | Should |
| POST | `/api/v1/llm/invocations/{id}/feedback` | JWT (`analyst` / `admin`) | Thumbs up/down and an optional comment on an insight | Should |

### 6.7 Contract changes required by v3.0 (drafts and remaining work)

| Contract | Change | Kind |
|---|---|---|
| `openapi-payment-gateway-v1.yaml` | Bearer JWT security scheme; `/api/v1/ops/**` requires `analyst` / `admin`; add `POST /api/v1/merchants/me` | Security change on endpoints that were documented as "local/demo only" + additive endpoint |
| `openapi-risk-engine-v1.yaml` | Bearer JWT on browser endpoints; health stays anonymous. Gateway/LLM service access is explicitly deferred to RISK-111 (Q12), with no anonymous bypass | Security change before freeze; ADR-0012 |
| `asyncapi-events-v1.yaml` | Drafted `risk.insights.v1` and identifier-only `RiskInsightGenerated`; producer review pending | Additive |
| `openapi-llm-insights-v1.yaml` | Drafted five operations (Section 6.6); producer/consumer review pending | New |
| `openapi-ml-scorer-v1.yaml` | Added and reviewed in RISK-140 / #18 (Section 6.2) | New; available |

None of the imported contracts has been frozen yet (freeze points H1, H6, H11), so these changes do not break a frozen contract.

---

## 7. Risk Engine backend design — owner: Jiawei Zhou (Release 1 + changes in 7.12)

### 7.1 Tech stack

| Concern | Choice |
|---|---|
| Runtime | Java 21, Spring Boot 4.1.2 (ADR-0008) |
| Initializr dependencies | Spring Web, Validation, Spring Data JPA, PostgreSQL Driver, Flyway Migration, Actuator, Testcontainers |
| Extra libraries | springdoc-openapi (Boot 4–compatible line), `resilience4j-circuitbreaker` (core library, used programmatically — avoids starter compatibility issues), WireMock (tests) |
| HTTP client | Spring `RestClient` with connect timeout 100 ms, read timeout 200 ms |
| Tests | JUnit Jupiter (Spring Boot-managed), AssertJ, MockMvc, Testcontainers (PostgreSQL), WireMock |

The RISK-11 M0 scaffold includes only Spring MVC, Actuator, JSON logging and request correlation. It listens on 8081 and starts without infrastructure. The stack and package tree below describe the M1/M2 implementation target. PostgreSQL 18 is the baseline for every persistence environment (ADR-0008).

### 7.2 Package structure (package-by-feature)

```text
com.albertchow.riskengine
├── assessment
│   ├── api/          RiskAssessmentController, ReviewController, DTOs (records), mappers
│   ├── domain/       RiskAssessment (entity), AssessmentStatus, RiskDecision, Review, Transaction
│   ├── service/      AssessmentService (orchestration), ScoreAggregator, IdempotencyService, ReviewService
│   └── persistence/  RiskAssessmentRepository, AuditEventRepository, AuditEvent
├── rules
│   ├── RiskRule (interface), RuleResult, RuleEngine
│   ├── impl/         BlocklistedCustomerRule, BlocklistedMerchantRule, AmountThresholdRule,
│   │                 HighRiskCountryRule, VelocityRule, CountryMismatchRule
│   └── RulesProperties (@ConfigurationProperties "risk.rules")
├── context
│   ├── CustomerContext (record), CustomerContextBuilder
├── ml
│   ├── MlScorerClient, MlScoreRequest/Response (records), MlScorerProperties
├── blocklist         controller, service, repository, entity
├── stats             StatsController, StatsService (native SQL aggregates)
└── common
    ├── error/        GlobalExceptionHandler, BusinessException, ErrorCode
    ├── web/          RequestIdFilter (MDC + header)
    └── config/       ClockConfig, RestClientConfig
```

### 7.3 Rule engine

```java
public interface RiskRule {
    String code();
    RuleResult evaluate(Transaction txn, CustomerContext ctx);
}

public record RuleResult(boolean matched, int scoreImpact, boolean hardDecline, String description) {
    public static RuleResult noMatch() { return new RuleResult(false, 0, false, null); }
}
```

`RuleEngine` receives `List<RiskRule>` from Spring (Strategy pattern), evaluates all, and returns matched `RuleHit`s plus `ruleScore`. Adding a rule = adding one `@Component` class — no other code changes (Open/Closed principle).

| Code | Condition | Impact | Hard decline |
|---|---|---|---|
| `BLOCKLISTED_CUSTOMER` | `customerId` in blocklist | 100 | ✅ |
| `BLOCKLISTED_MERCHANT` | `merchantId` in blocklist | 100 | ✅ |
| `AMOUNT_ABOVE_THRESHOLD` | amount ≥ threshold for currency (EUR 5,000 · GBP 4,300 · USD 5,500 · default 5,000) | 40 | |
| `HIGH_RISK_COUNTRY` | `countryCode` in configured list | 30 | |
| `VELOCITY_1H` | `ctx.txnCount1h` ≥ 5 | 35 | |
| `COUNTRY_MISMATCH` | `ctx.usualCountryCode` not null and ≠ `countryCode` | 20 | |

```yaml
risk:
  rules:
    amount-thresholds: { EUR: 5000, GBP: 4300, USD: 5500 }
    default-amount-threshold: 5000
    high-risk-countries: [KP, IR, SY, RU]   # illustrative list — document the source in the README
    velocity-max-per-hour: 5
  scoring:
    rule-weight: 0.5
    ml-weight: 0.5
    review-threshold: 40
    decline-threshold: 70
    escalation-threshold: 80
  ml:
    base-url: http://localhost:8000
    connect-timeout: 100ms
    read-timeout: 200ms
```

### 7.4 Customer context builder

Computed from previous assessments of the same `customerId` (excluding the current one), using `transactionTime` as the reference point:

| Field | Query |
|---|---|
| `txnCount1h` | count where `transaction_time` in [t − 60 min, t) |
| `txnCount24h` | count where `transaction_time` in [t − 24 h, t) |
| `avgAmount30d` | avg(amount) over [t − 30 d, t), null if none |
| `minutesSinceLastTxn` | t − max(transaction_time) where < t, null if none |
| `usualCountryCode` | mode(country_code) over [t − 90 d, t), null if none |
| `isNewCustomer` | no rows at all |

The same context feeds both the Java rules and the ML request, so both "see" identical history. Covered by index `idx_ra_customer_time`.

### 7.5 ML client & resilience

- `MlScorerClient.score(request)` returns `Optional<MlScore>`; empty means "unavailable".
- Resilience4j `CircuitBreaker`: sliding window 20 calls, failure-rate threshold 50 %, slow-call threshold 200 ms, open state 30 s, half-open 3 trial calls.
- Log every fallback at WARN with `requestId`; expose the breaker state via Actuator (Could).

### 7.6 Idempotency

- Unique constraint on `transaction_id`; column `request_hash` = SHA-256 of the canonicalised request.
- Same `transactionId` + same hash → return stored assessment (200), write `IDEMPOTENT_REPLAY` audit event, **do not** call ML again.
- Same `transactionId` + different hash → 409 `IDEMPOTENCY_CONFLICT`.
- Race (two concurrent first requests): catch `DataIntegrityViolationException` on insert → re-read and apply the rules above.

### 7.7 Review state machine

```text
                 engine decides REVIEW
   (new) ───────────────────────────────▶ PENDING_REVIEW ──analyst APPROVE/DECLINE──▶ REVIEWED
     │
     └── engine decides APPROVE/DECLINE ─▶ AUTO_DECIDED
```

- Review on any status other than `PENDING_REVIEW` → 409 `INVALID_STATUS_TRANSITION`.
- Optimistic locking (`@Version`) prevents two analysts overwriting each other → second one gets 409.
- Writes a `REVIEWED` audit event with reviewer, decision and note.

### 7.8 Database schema (Flyway `V1__init.sql`)

```sql
CREATE TABLE risk_assessment (
    id                UUID PRIMARY KEY,
    transaction_id    VARCHAR(64)   NOT NULL UNIQUE,
    request_hash      CHAR(64)      NOT NULL,
    customer_id       VARCHAR(64)   NOT NULL,
    merchant_id       VARCHAR(64)   NOT NULL,
    amount            NUMERIC(14,2) NOT NULL,
    currency          CHAR(3)       NOT NULL,
    country_code      CHAR(2)       NOT NULL,
    transaction_time  TIMESTAMPTZ   NOT NULL,
    rule_score        SMALLINT      NOT NULL,
    ml_score          SMALLINT,
    risk_score        SMALLINT      NOT NULL,
    decision          VARCHAR(10)   NOT NULL,
    final_decision    VARCHAR(10),
    status            VARCHAR(20)   NOT NULL,
    model_version     VARCHAR(40),
    degraded          BOOLEAN       NOT NULL DEFAULT FALSE,
    reasons           JSONB         NOT NULL DEFAULT '[]',
    rule_hits         JSONB         NOT NULL DEFAULT '[]',
    ml_factors        JSONB         NOT NULL DEFAULT '[]',
    reviewed_by       VARCHAR(100),
    reviewed_at       TIMESTAMPTZ,
    review_note       VARCHAR(500),
    assessed_at       TIMESTAMPTZ   NOT NULL,
    version           BIGINT        NOT NULL DEFAULT 0
);
CREATE INDEX idx_ra_customer_time  ON risk_assessment (customer_id, transaction_time DESC);
CREATE INDEX idx_ra_status_assessed ON risk_assessment (status, assessed_at DESC);
CREATE INDEX idx_ra_assessed       ON risk_assessment (assessed_at DESC);

CREATE TABLE blocklist_entry (
    id          UUID PRIMARY KEY,
    entry_type  VARCHAR(20)  NOT NULL CHECK (entry_type IN ('CUSTOMER','MERCHANT')),
    entry_value VARCHAR(64)  NOT NULL,
    reason      VARCHAR(255),
    created_by  VARCHAR(100),
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    UNIQUE (entry_type, entry_value)
);

CREATE TABLE audit_event (
    id            BIGSERIAL PRIMARY KEY,
    assessment_id UUID         NOT NULL REFERENCES risk_assessment(id),
    event_type    VARCHAR(40)  NOT NULL,
    actor         VARCHAR(100) NOT NULL,
    details       JSONB,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_assessment ON audit_event (assessment_id, created_at);
```

JSONB columns map with Hibernate `@JdbcTypeCode(SqlTypes.JSON)`. `audit_event` is append-only (no update/delete in code).

### 7.9 Observability

- `RequestIdFilter`: read or generate `X-Request-Id`, put in MDC, echo in response.
- Structured JSON logs (Spring Boot structured logging, `logging.structured.format.console=ecs`).
- Actuator: `health`, `info`; Could: `prometheus` + timers `risk.assessment.duration`, `risk.ml.call.duration`, counter `risk.ml.fallback`.

### 7.10 Testing

| Level | What | Tools |
|---|---|---|
| Unit | Each rule, `ScoreAggregator` (thresholds, escalation, hard decline, degraded), request hashing | JUnit Jupiter (Spring Boot-managed), AssertJ |
| Web slice | Validation, Problem Details, 404/409 mapping | `@WebMvcTest`, MockMvc |
| Integration | Repository queries, context builder, idempotency race, optimistic locking | `@SpringBootTest`, Testcontainers PostgreSQL (`@ServiceConnection`) |
| Contract-ish | ML client against WireMock stubs built from `openapi-ml-scorer-v1.yaml` examples; timeout → fallback | WireMock |

Coverage target: ≥ 80 % line coverage on `rules`, `assessment.service`.

### 7.11 Backend backlog (≈ 26 h)

| Key | Summary | Est. | Sprint |
|---|---|---|---|
| RISK-10 | Monorepo scaffold, CODEOWNERS, PR template, branch ruleset, invite team to GitHub | 1.5 h | 1 |
| RISK-11 | Spring Boot skeleton in `backend/`, stub endpoint, validation, Problem Details (ex-Sprint 1) | 2.5 h | 1 |
| RISK-12 | `backend-ci.yml` with path filters | 1 h | 1 |
| RISK-13 | PostgreSQL in docker-compose, Flyway V1, JPA entities, repositories + Testcontainers test | 3 h | 1 |
| RISK-14 | Rule engine framework + 6 rules + `RulesProperties` + unit tests | 4 h | 1 |
| RISK-15 | `CustomerContextBuilder` + integration tests | 2 h | 1 |
| RISK-16 | `MlScorerClient` with timeouts, circuit breaker, fallback + WireMock tests | 3 h | 2 |
| RISK-17 | `ScoreAggregator`, `AssessmentService`, idempotency, audit events | 3 h | 2 |
| RISK-18 | List / detail / audit-events / stats APIs with paging & filters | 2.5 h | 2 |
| RISK-19 | Review API, state machine, optimistic locking | 1.5 h | 2 |
| RISK-20 | Full docker-compose, seed-data script (≈ 500 transactions incl. fraud scenarios), README | 2 h | 2 |
| RISK-21 | (Should) Blocklist CRUD API | 1.5 h | 2 |

### 7.12 Risk Engine changes for v2.0 (Jiawei)

| Change | Detail |
|---|---|
| Accept gateway calls | No API change: the gateway sends `transactionId = paymentId`; the Risk Engine stays unaware of who calls it |
| Outbox + publisher | Same pattern as the gateway (Section 11.3): `outbox_event` table, written in the same DB transaction as the assessment / review |
| Publish | `RiskAssessmentCreated` after every new assessment; `RiskAssessmentReviewed` after every analyst review |
| Consume `payments.events.v1` | Update `payment_status` on the matching assessment (by `transactionId`); `PaymentRefunded` with reason `FRAUDULENT` → `fraud_confirmed = true` + audit event `FRAUD_CONFIRMED` |
| API 1.1.0 (additive) | `paymentStatus`, `fraudConfirmed` on `RiskAssessment` |
| Unknown transaction | Payment event for a `transactionId` with no assessment (e.g. gateway fallback path) → log + skip, never fail the consumer |

Flyway `V2__events.sql`:

```sql
ALTER TABLE risk_assessment ADD COLUMN payment_status  VARCHAR(30);
ALTER TABLE risk_assessment ADD COLUMN fraud_confirmed BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE outbox_event (
    id             UUID PRIMARY KEY,
    aggregate_type VARCHAR(40)  NOT NULL,
    aggregate_id   VARCHAR(64)  NOT NULL,   -- message key
    topic          VARCHAR(100) NOT NULL,
    event_type     VARCHAR(60)  NOT NULL,
    payload        JSONB        NOT NULL,   -- full envelope
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
    published_at   TIMESTAMPTZ
);
CREATE INDEX idx_outbox_unpublished ON outbox_event (created_at) WHERE published_at IS NULL;

CREATE TABLE processed_event (
    event_id     UUID         NOT NULL,
    consumer     VARCHAR(60)  NOT NULL,
    processed_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
    PRIMARY KEY (event_id, consumer)
);
```

Release 2 backlog items: RISK-82, RISK-83 (Section 10.11).

---

## 8. Frontend design — owner: Jiajun Xiao

> **v3.0 note.** Sections 8.1–8.7 describe the analyst and ops UI designed in v1.0/v2.0. That UI is now the **app area** of a larger website. Section 8.8 defines the new information architecture and takes precedence where the two disagree — in particular for routes (`/` is now the public homepage) and for the reviewer identity (now the signed-in Cognito user, not a name in `localStorage`). Jiajun maps the pages of Section 8.2 onto the new routes in the first frontend design PR.

### 8.1 Tech stack

| Concern | Choice | Why |
|---|---|---|
| Build | Vite + React 19 + TypeScript (strict) | Industry default for new SPAs |
| UI kit | Tailwind CSS v4 + shadcn/ui (Radix primitives) styled with our own design tokens; Motion (formerly Framer Motion) for animation; TanStack Table (+ TanStack Virtual) for tables. One kit for the public site and the app area (ADR-0010; replaces MUI + MUI X DataGrid) | Marketing pages need custom layout and motion; data tables need server-side paging and sorting; one token-driven library keeps the site and the app consistent |
| Component catalogue | Storybook, with axe accessibility checks | Documents every shared component and its states |
| Routing | React Router | Standard |
| Server state | TanStack Query | Caching, loading/error states, invalidation after review |
| API types | `openapi-typescript` + `openapi-fetch` generated from `contracts/openapi-risk-engine-v1.yaml` | Types always match the contract; a contract change = compile error |
| Forms | React Hook Form + Zod | Client-side validation mirrors API rules |
| Charts | Recharts | Simple bar/histogram charts |
| Mocks | MSW (Mock Service Worker) | Build the whole UI before the backend exists |
| Tests | Vitest + React Testing Library | Fast, Vite-native |
| End-to-end UI | Playwright (homepage, sample flow, login redirect, role-based dashboard) | Runs against the preview build in CI |
| Auth | `react-oidc-context` / `oidc-client-ts` (Authorization Code + PKCE, tokens in memory) | Section 14 |
| Lint/format | ESLint + Prettier | |
| Node | Current Node.js LTS | |

### 8.2 Pages (app area)

| Route | Page | Content | API calls | Priority |
|---|---|---|---|---|
| `/` | Dashboard | KPI cards (total, approve/review/decline counts, decline rate, pending review, degraded count, avg score), decision bar chart, score histogram, 5 most recent high-risk cases; time range 24 h / 7 d | `GET /stats/summary`, `GET /risk-assessments?minScore=70&size=5` | Must |
| `/assessments` | Assessments | Server-side paged table (TanStack Table); filters: decision, status, customerId, min score, date range; sort by time/score/amount; row click → detail | `GET /risk-assessments` | Must |
| `/assessments/:id` | Assessment detail | Transaction info; score breakdown (rule vs ML vs final); rule hits table; ML top factors; review panel; audit timeline; "degraded" banner | `GET /risk-assessments/{id}`, `GET …/audit-events` | Must |
| `/review` | Review queue | `status=PENDING_REVIEW`, oldest first; Approve / Decline buttons → dialog with note; queue refreshes after action | `GET /risk-assessments?status=PENDING_REVIEW&sort=assessedAt,asc`, `POST …/review` | Must |
| `/simulate` | Transaction simulator | Form for all request fields; preset buttons (Normal, High amount, High-risk country, Blocklisted customer, Burst ×6); shows the returned assessment; "Generate new transactionId" | `POST /risk-assessments` | Must |
| `/blocklist` | Blocklist | Table + add/remove | `/blocklist` endpoints | Should |
| `/settings` | Settings | User preferences. The reviewer identity now comes from the signed-in user (Section 14), **not** from a display name in `localStorage` as in v1.0 | — | Must |

### 8.3 UX rules

- Score colour bands match backend thresholds: **0–39 green "Low"**, **40–69 amber "Medium"**, **70–100 red "High"**. Always show the text label as well as colour (accessibility).
- Decision chips: APPROVE (success), REVIEW (warning), DECLINE (error).
- Money: format with `Intl.NumberFormat` using the transaction currency; never do arithmetic on amounts in the UI.
- Times: display in the browser's local time with the UTC value in a tooltip.
- Problem Details: show `title` + field `errors` next to form fields; 409 on review → "This case was already reviewed" and refresh.
- Loading skeletons and empty states for every list.

### 8.4 Code structure

```text
frontend/src/
├── api/
│   ├── schema.d.ts          # generated: npx openapi-typescript ../contracts/openapi-risk-engine-v1.yaml -o src/api/schema.d.ts
│   ├── client.ts            # openapi-fetch client, baseUrl '' (proxy), X-Request-Id
│   └── hooks/               # useAssessments, useAssessment, useReview, useStats, useSimulate
├── mocks/
│   ├── handlers.ts          # MSW handlers built from contract examples
│   └── fixtures/            # ~50 realistic assessments incl. degraded + reviewed
├── components/              # ScoreBadge, DecisionChip, ScoreBreakdown, RuleHitsTable, FactorList, AuditTimeline
├── pages/                   # Dashboard, Assessments, AssessmentDetail, ReviewQueue, Simulator, Blocklist, Settings
├── layout/                  # AppShell (side nav + top bar)
└── main.tsx
```

- Dev: `VITE_USE_MOCKS=true` turns on MSW; Vite `server.proxy` sends `/api` and `/actuator` to `http://localhost:8081` (no CORS needed).
- Docker: multi-stage build → nginx serves static files and proxies `/api` to `risk-engine:8081`.

### 8.5 Testing

- Component tests: `ScoreBadge` bands, `ScoreBreakdown` with `mlScore = null`, review dialog validation.
- Page tests with MSW: assessments filter → correct query string; review → queue refetch; simulator shows validation errors from a 400 response.
- Manual cross-browser check (Chrome, Edge) before v1.0.

### 8.6 Frontend backlog (≈ 23 h)

| Key | Summary | Est. | Sprint |
|---|---|---|---|
| RISK-30 | Vite + React + TS scaffold, ESLint/Prettier, UI kit theme (per the UI kit ADR), router, AppShell | 2 h | 1 |
| RISK-31 | Generated API types + client + MSW handlers & fixtures | 3 h | 1 |
| RISK-32 | Simulator page with presets and validation | 3 h | 1 |
| RISK-33 | Assessments list with server-side paging, filters, sorting | 4 h | 1 |
| RISK-34 | Assessment detail: breakdown, rule hits, ML factors, audit timeline | 3 h | 2 |
| RISK-35 | Review queue + review dialog + Settings (reviewer name) | 3 h | 2 |
| RISK-36 | Dashboard KPIs, decision chart, score histogram | 2.5 h | 2 |
| RISK-37 | Tests, `frontend-ci.yml`, Dockerfile (nginx) | 2.5 h | 2 |
| RISK-38 | (Should) Blocklist page | 1.5 h | 2 |

### 8.7 Frontend additions for v2.0 — proposed (Jiajun, ≈ 11 h, confirm at kick-off — Q8)

| Route | Page | Content | API |
|---|---|---|---|
| `/payments` | Payments | Paged table: id, merchant, amount, status chip, risk score badge, created; filters status/merchant/customer/date | `GET /api/v1/ops/payments` |
| `/payments/:id` | Payment detail | Summary card; **status timeline**; refunds; ledger table (debits/credits, balanced check ✓); link "View risk assessment →" | `GET /api/v1/ops/payments/{id}` |
| `/checkout` | Demo checkout (merchant simulator) | Amount, currency, customer, country, **test-token picker**, capture method; result panel; Capture / Cancel / Refund buttons for the created payment; auto-generates `Idempotency-Key` (with a "resend same key" button to demo idempotency) | merchant endpoints with `VITE_DEMO_MERCHANT_KEY` |
| `/assessments/:id` | (extend) | Show `paymentStatus`, `fraudConfirmed` badge, link to payment | risk API 1.1.0 |
| `/` | (extend) | Payment KPI row: approval rate, captured volume, pending holds | `GET /api/v1/ops/stats/summary` |

- Generate a second typed client: `npx openapi-typescript ../contracts/openapi-payment-gateway-v1.yaml -o src/api/gateway-schema.d.ts`.
- nginx/Vite proxy: `/api/v1/payments` and `/api/v1/ops` → `payment-gateway:8080`; all other `/api` → `risk-engine:8081`.
- The demo merchant key is a **local test key only**; never commit a real secret (`.env.example` holds a placeholder).

| Key | Summary | Est. |
|---|---|---|
| RISK-90 | Gateway typed client, MSW handlers, proxy routing | 2 h |
| RISK-91 | Payments list | 2.5 h |
| RISK-92 | Payment detail: timeline, refunds, ledger, assessment link | 3 h |
| RISK-93 | Demo checkout with capture/cancel/refund actions | 2.5 h |
| RISK-94 | Cross-links + dashboard payment KPIs | 1 h |

### 8.8 Website and web app information architecture (v3.0)

> **Working Backwards.** *Customer:* a recruiter, interviewer or engineer who lands on the site with five minutes to spare, and a demo merchant or analyst who wants to use the product. *Problem:* a GitHub repository and a `docker compose up` instruction do not show what the platform does; an analyst UI alone does not explain the product. *Solution:* a public website that explains Sentinel Pay in one screen, an interactive sample that runs a payment through gateway → rules → ML → LLM summary → decision with no login and no backend, and a signed-in product area where merchants and analysts do real work against the staging environment.

#### 8.8.1 Visual direction

- Clean, modern fintech marketing style **inspired by** the Stripe Ireland website: a large hero with a slogan over a gradient or visual background, generous white space, crisp typography and subtle scroll animations.
- **Do not copy Stripe's assets.** No logo, wordmark, illustrations, copy, exact gradients or code. Use our own brand "Sentinel Pay", our own colours and our own text.
- Every page footer says *"Portfolio project — not a real payment service."* Pricing is labelled as demo pricing.
- Accessibility target: WCAG 2.1 AA — keyboard navigation, contrast, alt text, reduced-motion support.

#### 8.8.2 Routes

| Route | Access | Content |
|---|---|---|
| `/` | public | **Homepage.** Hero (slogan + background visual + CTAs "Start now" / "See a sample"). Scrolling sections: product showcase (animated cards for Payments, Risk Engine, AI insights), how-it-works flow, KPI strip, developer/API snippet, CTA |
| `/sample` | public | **Interactive demo.** Pre-built scenarios on mock data (normal payment, high amount, blocklisted customer, burst, review → approve). Each step is animated: gateway → risk rules → ML score → LLM summary → decision. Runs fully client-side on a bundled mock dataset (no backend, no cost) |
| `/product` | login required | **The real product.** Merchants: create payments, manage API keys, view their payments. Analysts: review queue. Unauthenticated users are redirected to `/login?returnTo=/product` |
| `/dashboard` | login required, **role-based** | `merchant` → **Merchant dashboard** (own volume, approval rate, declines by reason, refunds). `analyst` / `admin` → **Transaction analytics dashboard** (decision mix, decline rate by rule, ML score distribution, fraud-confirmed vs predicted, degraded rate, review backlog and SLA) to decide whether the risk strategy needs tuning |
| `/internal/llm` | `developer` / `admin` | LLM Console (Section 13.11). Not in the public navigation; linked from the dashboard for these roles |
| `/pricing` | public | Demo pricing tiers (Starter / Growth / Enterprise), a fee calculator and an FAQ |
| `/about` | public | Team page: the three members, their roles, links (GitHub/LinkedIn placeholders until provided) and the project story |
| `/docs` | public (Could) | Developer docs rendered from the OpenAPI contracts |
| `/login`, `/signup` | public | Cognito Hosted UI (redirect) or an embedded flow |

**Top navigation bar.** Left: logo, **Product**, **Sample**, **Dashboard** (only when logged in), **About us**, **Pricing**. Right: **Log in** (text button) and **Sign up** (primary button). When logged in, the right side shows an avatar menu with role, settings and logout.

#### 8.8.3 Behaviour that crosses components

- **AI summaries** appear on the review queue and the assessment detail, always labelled *"AI-generated, advisory"*, with thumbs up/down feedback (Section 6.6). A missing summary is a normal state, not an error.
- **Sleeping environment.** The frontend is always available (S3 + CloudFront). It checks `/api/health` with a short timeout; when the backend is stopped it shows *"Demo environment is sleeping — available Mon–Fri 09:00–23:00 Irish time"*. `/sample` keeps working because it is fully client-side.
- **Role-based rendering** is a convenience only. Every backend enforces roles and tenant scoping itself (Section 14.5).
- **API routing.** Two more typed clients are generated: one from `openapi-llm-insights-v1.yaml`, and the existing gateway and risk clients gain the bearer token. Path routing (`/api/v1/payments`, `/api/v1/ops`, `/api/v1/merchants` → gateway; `/api/v1/insights`, `/api/v1/llm` → llm-insights; other `/api` → risk-engine) is done by nginx in Docker and in staging, and by the Vite proxy in development.

#### 8.8.4 Stack changes

Unchanged: React 19, TypeScript strict, Vite, React Router, TanStack Query, generated API types (`openapi-typescript` + `openapi-fetch`), React Hook Form + Zod, MSW, Vitest + React Testing Library. Added: Playwright, an OIDC client, and the UI kit decision in Section 8.1. The frontend backlog for the v3.0 scope is planned in `docs/ROADMAP.md`.

---

## 9. ML scoring design — owner: Zheng Liu

### 9.1 Tech stack

| Concern | Choice |
|---|---|
| Runtime | Python 3.12, managed with **uv** |
| API | FastAPI + Pydantic v2 (camelCase aliases), Uvicorn |
| Data / model | pandas, NumPy, scikit-learn (`HistGradientBoostingClassifier`), joblib |
| Quality | pytest, httpx `TestClient`, ruff |
| Notebook (optional) | Jupyter for exploration only — production code lives in modules |

### 9.2 Project structure

```text
ml-scorer/
├── pyproject.toml / uv.lock
├── src/ml_scorer/
│   ├── api/main.py          # FastAPI app, routes, startup model loading
│   ├── api/schemas.py       # Pydantic models = openapi-ml-scorer-v1.yaml
│   ├── features.py          # build_features(request) -> feature vector  (used by BOTH training and serving)
│   ├── explain.py           # top-3 factors
│   ├── model_store.py       # load model.joblib + metadata.json
│   └── settings.py
├── training/
│   ├── generate_data.py     # synthetic dataset, fixed seed
│   ├── train.py             # train + evaluate + save artefacts
│   └── evaluate.py          # metrics + report
├── models/                  # model.joblib, metadata.json (small; or build in Docker)
├── reports/                 # evaluation report (markdown + PR curve PNG)
├── tests/
└── Dockerfile
```

### 9.3 Synthetic data (`generate_data.py`)

The dataset must be **reproducible** (seed 42) and **honest**: README, `/v1/model-info` and the model card all state it is synthetic.

- 100,000 transactions, ~5,000 customers, ~500 merchants, 60 days, target fraud rate ≈ 2 %.
- Each customer has a home country, typical amount (log-normal) and typical active hours.
- Each row carries the same `customerContext` fields the backend will compute (Section 7.4), calculated from that customer's earlier rows — so training data matches serving data.
- Injected fraud patterns (document each with its share of fraud):
  1. **Amount spike** — amount 8–30× the customer's 30-day average.
  2. **Burst** — 5+ transactions within an hour.
  3. **Foreign + night** — different country from usual, 00:00–05:00.
  4. **New customer, high amount** — no history and amount in the top 5 %.
  5. **Noise** — ~10 % of fraud looks normal; ~1 % of legitimate rows look suspicious (keeps the model honest, avoids a perfect score).

### 9.4 Features (`features.py`)

| Feature | Derived from |
|---|---|
| `logAmount` | ln(1 + amount) |
| `amountToAvgRatio` | amount / avgAmount30d (fallback 1.0 if null) |
| `hourOfDay` | transactionTime (UTC — limitation noted; local time in v1.1) |
| `isNight` | hour in 0–5 |
| `txnCount1h`, `txnCount24h` | context |
| `minutesSinceLastTxn` | context (fallback: large value, e.g. 99,999) |
| `countryMismatch` | usualCountryCode ≠ countryCode |
| `isNewCustomer` | context |
| `isHighRiskCountry` | own list, kept in sync with backend config |

**One function, two callers:** `build_features()` is used by `train.py` and by `/v1/score`. This prevents training–serving skew — a classic ML production bug and a good interview talking point.

### 9.5 Model & evaluation

- Algorithm: `HistGradientBoostingClassifier` (fast, handles non-linear interactions, no scaling needed). Baseline to beat: `LogisticRegression`.
- Split: **time-based** (first 48 days train, last 12 days test) — random splits leak future information.
- Report: ROC-AUC, **PR-AUC** (main metric for imbalanced data), precision/recall at score 50 and 70, confusion matrix, PR curve.
- v1.0 acceptance bar (on synthetic test set): PR-AUC ≥ 0.6 and recall ≥ 0.7 at score ≥ 50. If results look *too* good (PR-AUC > 0.98), the synthetic patterns are too easy — add noise.
- Artefacts: `model.joblib` + `metadata.json` (`modelVersion` e.g. `hgb-1.0.0`, `trainedAt`, `features`, `metrics`, `trainingData`).

### 9.6 Explanations (`explain.py`) — v1 heuristic

For each feature, compare the request's value with the training distribution (stored in metadata as percentiles). Rank features by how unusual they are **and** in which direction fraud usually goes; return the top 3 with a human-readable description (e.g. "Amount is 12.4× the customer's 30-day average"). Clearly documented as heuristic; SHAP in v1.1.

### 9.7 Serving

- Load the model once at startup (FastAPI lifespan). If loading fails → `/health` reports `modelLoaded: false`, `/v1/score` returns 503.
- `score = round(fraudProbability × 100)`.
- Log `X-Request-Id`, `transactionId`, score and latency per request (JSON logs). Never log full payloads.
- Latency target p95 < 50 ms — measure with a simple loop in a test and record it in the report.

### 9.8 Testing

- `test_features.py`: null-context handling, ratio fallback, night flag edges (hour 5 vs 6).
- `test_api.py`: valid request → 200 with schema-valid response; invalid currency → 422; model missing → 503.
- `test_model_smoke.py`: train on 2,000 generated rows in CI and check the pipeline runs end to end.
- Contract check: response validates against `contracts/openapi-ml-scorer-v1.yaml` (e.g. with `openapi-core`).

### 9.9 ML backlog (≈ 20 h)

| Key | Summary | Est. | Sprint |
|---|---|---|---|
| RISK-50 | FastAPI scaffold, schemas from contract, `/health`, `/v1/model-info` stub, ruff + pytest | 2 h | 1 |
| RISK-51 | Synthetic data generator with documented fraud patterns | 3 h | 1 |
| RISK-52 | Shared feature module + unit tests | 3 h | 1 |
| RISK-53 | Training & evaluation pipeline, report, artefacts | 4 h | 1 |
| RISK-54 | `/v1/score` with startup model loading and latency check | 2 h | 2 |
| RISK-55 | Top-3 factor explanations | 2 h | 2 |
| RISK-56 | Dockerfile, `ml-ci.yml`, contract validation test | 2 h | 2 |
| RISK-57 | Model card (`docs/model-card.md`) | 1.5 h | 2 |

### 9.10 ML additions for v2.0 — proposed (Zheng, ≈ 8 h, confirm at kick-off — Q8)

**Goal:** close the loop — collect real outcome labels from the platform and show how the model would be retrained.

- `ml-scorer/feedback/collector.py`: Kafka consumer (`confluent-kafka`, group `ml-scorer.feedback`) on `payments.events.v1`.
  - `PaymentRefunded` with `refundReason = FRAUDULENT` → label 1; `PaymentCaptured` with no fraud refund after a configurable window → label 0 (v2.0 demo: window = 10 minutes).
  - Idempotent: dedupe on `eventId` (SQLite or a `ml_feedback` table in its own schema).
  - Runs as a separate process/container (`ml-feedback`), **not** inside the scoring API — scoring latency must not be affected.
- `training/retrain.py`: joins feedback labels with the features the backend sent (store the `ScoreRequest` per `transactionId` at scoring time in a local append-only file/table) and retrains on synthetic + feedback data; outputs a new `modelVersion` and a comparison report vs the current model.
- Honest framing in the model card: feedback from a demo is tiny; the point is the **pipeline**, not the metric.

| Key | Summary | Est. |
|---|---|---|
| RISK-95 | Persist scored feature vectors per `transactionId` | 1.5 h |
| RISK-96 | Kafka feedback collector + container | 3 h |
| RISK-97 | Retrain script + comparison report | 2.5 h |
| RISK-98 | (Could) Score-distribution drift report | 1 h |

---

## 10. Payment Gateway design — owner: Jiawei Zhou (Release 2)

### 10.1 Tech stack

| Concern | Choice |
|---|---|
| Runtime | Java 21, Spring Boot 4.1.x — same baseline as the Risk Engine |
| Initializr dependencies | Spring Web, Validation, Spring Data JPA, PostgreSQL Driver, Flyway Migration, **Spring for Apache Kafka**, Actuator, Testcontainers |
| Extra libraries | springdoc-openapi, `resilience4j-circuitbreaker` (core), `ulid-creator` (sortable IDs), WireMock (tests) |
| HTTP client to Risk Engine | `RestClient`, connect 100 ms / read 300 ms, circuit breaker (window 20, failure 50 %, open 30 s) |
| Tests | JUnit Jupiter (Spring Boot-managed), AssertJ, MockMvc, Testcontainers (PostgreSQL **and** Kafka `apache/kafka` image), WireMock, Awaitility (async assertions) |

> Don't share Java code with `backend/` through a common module. Copy the small bits you need (e.g. `RequestIdFilter`) — **share contracts, not code**. A shared library couples the release cycles of two services.

### 10.2 Package structure

```text
com.albertchow.gateway
├── payment
│   ├── api/          PaymentController, OpsPaymentController, DTOs (records), mappers
│   ├── domain/       Payment, PaymentStatus, PaymentStateMachine, DeclineReason, CaptureMethod, StatusChange
│   ├── service/      PaymentService (create/authorise orchestration), CaptureService, CancelService,
│   │                 RefundService, ReviewDecisionHandler, ReviewTimeoutJob, StuckPaymentRecoveryJob
│   └── persistence/  PaymentRepository, StatusChangeRepository, RefundRepository
├── merchant          Merchant, MerchantRepository, ApiKeyAuthFilter, CurrentMerchant
├── idempotency       IdempotencyService, IdempotencyRecord, IdempotencyRepository, IdempotencyCleanupJob
├── risk              RiskEngineClient, RiskAssessmentRequest/Response (local records), RiskFallbackPolicy
├── acquirer          AcquirerClient (interface), SimulatedAcquirer, AcquirerResult
├── ledger            LedgerService, LedgerEntry, Account, FeeCalculator           (Should)
├── events            OutboxEvent, OutboxWriter, OutboxPublisher, RiskEventsListener,
│                     ProcessedEvent, EventEnvelope, event payload records
├── stats             OpsStatsService
└── common            error/ (GlobalExceptionHandler, ErrorCode), web/ (RequestIdFilter), config/
```

### 10.3 Payment state machine

```text
                           ┌──────────── DECLINE (risk) / fallback over limit ───────────────┐
                           │                                                                 ▼
 (new) ─▶ RISK_CHECKING ───┼── REVIEW ──▶ PENDING_RISK_REVIEW ──reviewed DECLINE / timeout──▶ DECLINED
                           │                     │        └──cancel──▶ CANCELED
                           │                     └─reviewed APPROVE─┐
                           └── APPROVE / fallback under limit ──────┴─▶ AUTHORIZING ──issuer decline──▶ DECLINED
                                                                             │  └──acquirer timeout/error──▶ FAILED
                                                                             ▼
                                                     CANCELED ◀──cancel── AUTHORIZED ──capture──▶ CAPTURED
                                                                                                    │ refund (partial)
                                                                                                    ▼
                                                                    REFUNDED ◀──refund (rest)── PARTIALLY_REFUNDED
```

- `PaymentStateMachine.transition(payment, target, reason, actor)` is the **only** place status changes; it throws `InvalidStateTransitionException` (→ 409 `INVALID_PAYMENT_STATE`) for anything not on the diagram.
- Every transition writes a `payment_status_history` row and, where an event exists, an `outbox_event` row — **in the same DB transaction**.
- With `captureMethod = AUTOMATIC`, `AUTHORIZED → CAPTURED` happens in the same transaction as the authorisation result.
- Optimistic locking (`@Version`) on `payment` protects against the API and the Kafka listener updating the same payment at once.

### 10.4 Merchant authentication

- Header `X-API-Key: sk_test_<random>`; stored as SHA-256 hash in `merchant.api_key_hash` (never plaintext).
- `ApiKeyAuthFilter` (a `OncePerRequestFilter`) resolves the merchant for `/api/v1/payments/**`; missing/invalid key → 401 Problem Details.
- Every query is scoped by `merchant_id`; another merchant's payment → **404, not 403** (don't reveal it exists).
- Flyway seed (`V2__seed_merchants.sql`, local profile only): two demo merchants, e.g. "Liffey Books" and "Docklands Coffee", with test keys printed in the README.
- **v3.0 — web users.** A merchant who signs in through Cognito is linked to a merchant record by `POST /api/v1/merchants/me` (Section 14.4). This needs a `cognito_sub` column on `merchant` (unique, nullable for seed merchants) in a new Flyway migration. Web requests carry a JWT; programmatic payment calls keep using `X-API-Key`. API keys are created and rotated from `/product`, shown once, and stored only as a hash.

### 10.5 Idempotency (Stripe-style)

| Case | Behaviour |
|---|---|
| Header missing on a money-moving POST | 400 `MISSING_IDEMPOTENCY_KEY` |
| First request with key K | Insert `idempotency_record(merchant, K, request_hash, status=IN_PROGRESS)` → process → store response status + body, `status=COMPLETED` |
| Same K, same hash, COMPLETED | Return stored response, header `Idempotent-Replayed: true`; no side effects |
| Same K, same hash, IN_PROGRESS | 409 `IDEMPOTENCY_REQUEST_IN_PROGRESS` (client retries later) |
| Same K, different hash | 409 `IDEMPOTENCY_KEY_REUSED` |
| Records older than 24 h | Deleted by `IdempotencyCleanupJob` |

Keys are scoped per merchant **and** per endpoint (`POST /payments` and `POST /payments/{id}/refunds` with the same key are different records). The gateway also uses `paymentId` as the Risk Engine's `transactionId`, so a retried risk call is idempotent on the risk side too.

### 10.6 Simulated acquirer

`AcquirerClient` is an interface so a real acquirer adapter could replace the simulator later (Ports & Adapters).

| Token | Result | Simulated latency |
|---|---|---|
| `tok_visa_success`, `tok_mastercard_success` | Approved, 6-char `authorizationCode` | 50–150 ms |
| `tok_insufficient_funds` | Declined `INSUFFICIENT_FUNDS` | 50–150 ms |
| `tok_card_declined` | Declined `CARD_DECLINED` | 50–150 ms |
| `tok_expired_card` | Declined `EXPIRED_CARD` | 50–150 ms |
| `tok_acquirer_timeout` | Sleeps past the 2 s acquirer timeout → `FAILED` | 2.5 s |

Config `gateway.acquirer.random-failure-rate` (default 0) lets you inject random failures for resilience demos.

### 10.7 Ledger — double-entry (Should, recommended)

Every money movement is a **journal** whose debit and credit lines balance. This is where an accounting background becomes a design advantage — a strong interview story.

| Event | Journal lines |
|---|---|
| Capture of amount A | DR `ACQUIRER_RECEIVABLE` A · CR `MERCHANT_PAYABLE` A |
| Processing fee F on capture | DR `MERCHANT_PAYABLE` F · CR `FEE_REVENUE` F |
| Refund of amount R | DR `MERCHANT_PAYABLE` R · CR `ACQUIRER_RECEIVABLE` R |

- Fee (illustrative, configurable): **1.4 % + 0.25** in the payment currency, rounded with `RoundingMode.HALF_EVEN` to 2 dp. Fees are **not returned on refunds** in v2.0 (state this policy in the README).
- Ledger rows are **append-only**; corrections are new journals, never updates.
- Tests assert two invariants: Σ debits = Σ credits per journal; and per payment, `MERCHANT_PAYABLE` balance = captured − refunded − fees.

### 10.8 Recovery jobs

| Job | Schedule | Action |
|---|---|---|
| `ReviewTimeoutJob` | every 60 s | `PENDING_RISK_REVIEW` older than `gateway.risk.review-timeout` (default 30 min; demo profile 3 min) → `DECLINED` (`RISK_REVIEW_TIMEOUT`) |
| `StuckPaymentRecoveryJob` | every 60 s | `RISK_CHECKING` or `AUTHORIZING` older than 2 min (process crashed mid-flow) → `FAILED` + event; logged at ERROR. (A real gateway would query the acquirer for the authorisation status first — note as a known simplification.) |
| `IdempotencyCleanupJob` | hourly | Delete records older than 24 h |
| `OutboxPublisher` | every 500 ms | Section 11.3 |

Use ShedLock or a simple `SELECT … FOR UPDATE SKIP LOCKED` so jobs stay correct if two gateway instances run (Could: demo with `docker compose up --scale payment-gateway=2` behind nginx).

### 10.9 Database schema (database `gateway`, Flyway `V1__init.sql`)

```sql
CREATE TABLE merchant (
    id            VARCHAR(40)  PRIMARY KEY,           -- mer_<ulid>
    name          VARCHAR(100) NOT NULL,
    api_key_hash  CHAR(64)     NOT NULL UNIQUE,
    status        VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE payment (
    id                  VARCHAR(40)   PRIMARY KEY,     -- pay_<ulid>
    merchant_id         VARCHAR(40)   NOT NULL REFERENCES merchant(id),
    merchant_reference  VARCHAR(64),
    amount              NUMERIC(14,2) NOT NULL CHECK (amount > 0),
    currency            CHAR(3)       NOT NULL,
    customer_id         VARCHAR(64)   NOT NULL,
    country_code        CHAR(2)       NOT NULL,
    payment_method_token VARCHAR(40)  NOT NULL,        -- test token only, never a PAN
    payment_method_brand VARCHAR(20)  NOT NULL,
    capture_method      VARCHAR(10)   NOT NULL,
    status              VARCHAR(30)   NOT NULL,
    decline_reason      VARCHAR(40),
    amount_captured     NUMERIC(14,2) NOT NULL DEFAULT 0,
    amount_refunded     NUMERIC(14,2) NOT NULL DEFAULT 0,
    authorization_code  VARCHAR(12),
    risk_assessment_id  UUID,
    risk_decision       VARCHAR(10),
    risk_score          SMALLINT,
    risk_fallback       BOOLEAN       NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ   NOT NULL DEFAULT now(),
    version             BIGINT        NOT NULL DEFAULT 0,
    CHECK (amount_captured <= amount),
    CHECK (amount_refunded <= amount_captured)
);
CREATE INDEX idx_payment_merchant_created ON payment (merchant_id, created_at DESC);
CREATE INDEX idx_payment_status_updated   ON payment (status, updated_at);

CREATE TABLE payment_status_history (
    id           BIGSERIAL    PRIMARY KEY,
    payment_id   VARCHAR(40)  NOT NULL REFERENCES payment(id),
    from_status  VARCHAR(30),
    to_status    VARCHAR(30)  NOT NULL,
    reason       VARCHAR(60),
    actor        VARCHAR(100) NOT NULL,
    occurred_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX idx_psh_payment ON payment_status_history (payment_id, occurred_at);

CREATE TABLE refund (
    id          VARCHAR(40)   PRIMARY KEY,             -- re_<ulid>
    payment_id  VARCHAR(40)   NOT NULL REFERENCES payment(id),
    amount      NUMERIC(14,2) NOT NULL CHECK (amount > 0),
    currency    CHAR(3)       NOT NULL,
    reason      VARCHAR(30)   NOT NULL,
    note        VARCHAR(255),
    status      VARCHAR(20)   NOT NULL,
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE TABLE idempotency_record (
    merchant_id     VARCHAR(40)  NOT NULL,
    endpoint        VARCHAR(100) NOT NULL,             -- e.g. 'POST /payments'
    idempotency_key VARCHAR(64)  NOT NULL,
    request_hash    CHAR(64)     NOT NULL,
    status          VARCHAR(20)  NOT NULL,             -- IN_PROGRESS | COMPLETED
    response_status SMALLINT,
    response_body   JSONB,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    PRIMARY KEY (merchant_id, endpoint, idempotency_key)
);

CREATE TABLE ledger_entry (                            -- Should
    id          UUID          PRIMARY KEY,
    journal_id  UUID          NOT NULL,
    payment_id  VARCHAR(40)   NOT NULL REFERENCES payment(id),
    account     VARCHAR(30)   NOT NULL,
    direction   VARCHAR(6)    NOT NULL CHECK (direction IN ('DEBIT','CREDIT')),
    amount      NUMERIC(14,2) NOT NULL CHECK (amount > 0),
    currency    CHAR(3)       NOT NULL,
    entry_type  VARCHAR(20)   NOT NULL,
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT now()
);
CREATE INDEX idx_ledger_payment ON ledger_entry (payment_id);

-- outbox_event and processed_event: same DDL as the Risk Engine (Section 7.12)
```

### 10.10 Testing

| Level | What | Tools |
|---|---|---|
| Unit | State machine (every allowed + forbidden transition), fee calculation & rounding, ledger balance invariants, fallback policy, request hashing | JUnit Jupiter (Spring Boot-managed), AssertJ, parameterised tests |
| Web slice | Validation, API-key filter (401/404 scoping), Problem Details codes | `@WebMvcTest`, MockMvc |
| Integration | Create → capture → refund on real PostgreSQL; idempotency race (two threads, same key); optimistic locking | Testcontainers PostgreSQL |
| Integration (events) | Outbox row → message on Kafka; duplicate `RiskAssessmentReviewed` processed once; poison message → DLT | Testcontainers Kafka, Awaitility |
| Contract | Risk Engine client against WireMock stubs from `openapi-risk-engine-v1.yaml` examples; timeouts → fallback | WireMock |

Coverage target ≥ 80 % on `payment.domain`, `payment.service`, `idempotency`, `ledger`.

### 10.11 Release 2 backlog — Jiawei (≈ 35 h total, ≈ 31.5 h Must)

| Key | Summary | Est. | Sprint | Priority |
|---|---|---|---|---|
| RISK-70 | `payment-gateway/` skeleton, API-key filter, seed merchants, `gateway-ci.yml` | 2.5 h | 3 | Must |
| RISK-71 | Flyway schema, entities, repositories + Testcontainers test | 3 h | 3 | Must |
| RISK-72 | `PaymentStateMachine` + exhaustive unit tests | 2 h | 3 | Must |
| RISK-73 | Idempotency-Key service (replay, in-progress, reuse, cleanup) | 2.5 h | 3 | Must |
| RISK-74 | `RiskEngineClient` + circuit breaker + fallback policy + WireMock tests | 2.5 h | 3 | Must |
| RISK-75 | `SimulatedAcquirer` + create/authorise flow (auto & manual capture) | 2.5 h | 3 | Must |
| RISK-76 | Capture / cancel / refund endpoints with amount rules | 3 h | 3 | Must |
| RISK-77 | Outbox writer + publisher + Kafka in compose + Testcontainers Kafka test | 3 h | 4 | Must |
| RISK-78 | `RiskEventsListener` (resume/decline held payments), `ReviewTimeoutJob`, `StuckPaymentRecoveryJob` | 2.5 h | 4 | Must |
| RISK-79 | Ops endpoints: list, detail (history, refunds, ledger) | 1.5 h | 4 | Must |
| RISK-80 | Double-entry ledger + invariant tests | 2.5 h | 4 | Should |
| RISK-81 | Ops stats endpoint | 1 h | 4 | Should |
| RISK-82 | Risk Engine: outbox + publish `RiskAssessmentCreated/Reviewed` | 2 h | 4 | Must |
| RISK-83 | Risk Engine: consume payment events, `payment_status`, `fraud_confirmed` (Flyway V2), API 1.1.0 | 2 h | 4 | Must |
| RISK-84 | v2.0 E2E scenarios (Newman), demo rehearsal, README & architecture diagram | 2 h | 4 | Must |

Must-only total ≈ 31.5 h over two weeks — **slightly above** the 10–15 h/week range, so the plan has no slack. Mitigations, in order: (1) start RISK-70/71 in the v1.0 buffer days if v1.0 finishes early; (2) drop RISK-81, then RISK-80; (3) hand the Newman collection in RISK-84 to Jiajun; (4) if still behind on Wed 9 Dec, move RISK-83 to v2.1 (the platform works without it; only the risk UI loses payment status).

---

## 11. Event-driven integration (Kafka)

### 11.1 Topics

| Topic | Partitions | Key | Retention | Producer |
|---|---|---|---|---|
| `payments.events.v1` | 3 | `paymentId` | 7 days | payment-gateway |
| `risk.assessments.v1` | 3 | `transactionId` (= `paymentId`) | 7 days | risk-engine |
| `risk.insights.v1` *(v3.0)* | 3 | `transactionId` (proposed, keeps per-payment ordering) | 7 days | llm-insights |
| `payments.events.v1.dlt`, `risk.assessments.v1.dlt` | 1 | same | 14 days | consumers' error handlers |

Topics are created on startup by Spring `NewTopic` beans in the producing service (local/dev only; in production, topics would be provisioned by infrastructure code).

### 11.2 Delivery guarantees

- **At-least-once** delivery end to end. Duplicates are expected and harmless because every consumer is idempotent.
- Ordering is guaranteed **per payment** (same key → same partition), which is all the business logic needs.
- Producer: `acks=all`, `enable.idempotence=true`.
- Consumer: manual ack after the DB transaction commits; `DefaultErrorHandler` with 3 retries (exponential back-off 1 s → 4 s), then `DeadLetterPublishingRecoverer` → `.dlt`.
- Unknown `eventType` on a topic → log at INFO and acknowledge (forward compatibility).

### 11.3 Transactional outbox (ADR-006)

**Problem it solves:** "save to DB, then send to Kafka" can fail between the two steps → the payment is captured but nobody hears about it (or the reverse). The outbox writes the event **into the same database transaction** as the business change; a separate publisher ships it to Kafka afterwards.

```text
TX:  UPDATE payment SET status='CAPTURED' …
     INSERT INTO payment_status_history …
     INSERT INTO ledger_entry …
     INSERT INTO outbox_event (topic, key, payload)      ← same commit
COMMIT

OutboxPublisher (every 500 ms):
     SELECT … FROM outbox_event WHERE published_at IS NULL
       ORDER BY created_at LIMIT 100 FOR UPDATE SKIP LOCKED
     for each: kafkaTemplate.send(topic, key, payload).get(5 s)
               UPDATE outbox_event SET published_at = now()
```

- If Kafka is down, rows accumulate and are published when it returns — **demo this** (scenario P11).
- Published rows older than 7 days are purged by a cleanup job.
- Upgrade path (roadmap): replace polling with Debezium change-data-capture.

### 11.4 Idempotent consumer (inbox)

```text
@KafkaListener(topics = "risk.assessments.v1", groupId = "gateway.risk-events")
TX:  INSERT INTO processed_event (event_id, consumer) VALUES (?, 'gateway.risk-events')
       → duplicate key? → skip (already processed), ack
     apply business change (state machine)
COMMIT → ack
```

### 11.5 Failure-mode matrix

| Failure | Effect on payments | Recovery |
|---|---|---|
| Risk Engine down | Fallback policy (Section 4.7) | Circuit breaker half-opens after 30 s |
| ML scorer down | Risk Engine decides on rules (`degraded`) | Automatic |
| Kafka down | Payments still processed; events queue in outbox; held payments wait | Outbox drains on recovery; review timeout still applies |
| Gateway crashes mid-payment | Payment stuck in `RISK_CHECKING`/`AUTHORIZING` | `StuckPaymentRecoveryJob` |
| Consumer bug / poison message | Message goes to DLT after retries; other messages continue | Fix, then replay from DLT (Could: small replay endpoint) |
| Duplicate event | None | `processed_event` dedupe |

### 11.6 Local tooling

- `docker exec -it kafka /opt/kafka/bin/kafka-console-consumer.sh --bootstrap-server localhost:9092 --topic payments.events.v1 --from-beginning --property print.key=true`
- Kafka UI at http://localhost:8085 (Could).
- `e2e/events/*.json`: one sample message per event type (taken from the AsyncAPI file) for consumers to test against before H8.

---

## 12. Integration & deployment

### 12.1 docker-compose (v2.0 target)

```yaml
services:
  postgres:
    image: postgres:18
    environment:
      POSTGRES_DB: sentinel
      POSTGRES_USER: sentinel
      POSTGRES_PASSWORD: sentinel          # local only — never reuse
    volumes:
      - ./docker/postgres/init:/docker-entrypoint-initdb.d:ro
      - postgres-data:/var/lib/postgresql   # PostgreSQL 18: PGDATA=/var/lib/postgresql/18/docker
    ports: ["5432:5432"]
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U sentinel"]
      interval: 5s
      retries: 10

  kafka:
    image: apache/kafka:4.0.0
    ports: ["9092:9092"]
    environment:
      KAFKA_NODE_ID: 1
      KAFKA_PROCESS_ROLES: broker,controller
      KAFKA_LISTENERS: PLAINTEXT://:19092,CONTROLLER://:9093,PLAINTEXT_HOST://:9092
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://kafka:19092,PLAINTEXT_HOST://localhost:9092
      KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: CONTROLLER:PLAINTEXT,PLAINTEXT:PLAINTEXT,PLAINTEXT_HOST:PLAINTEXT
      KAFKA_CONTROLLER_LISTENER_NAMES: CONTROLLER
      KAFKA_CONTROLLER_QUORUM_VOTERS: 1@kafka:9093
      KAFKA_INTER_BROKER_LISTENER_NAME: PLAINTEXT
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
      KAFKA_TRANSACTION_STATE_LOG_REPLICATION_FACTOR: 1
      KAFKA_TRANSACTION_STATE_LOG_MIN_ISR: 1
      KAFKA_GROUP_INITIAL_REBALANCE_DELAY_MS: 0
      KAFKA_NUM_PARTITIONS: 3
    healthcheck:
      test: ["CMD-SHELL", "/opt/kafka/bin/kafka-broker-api-versions.sh --bootstrap-server localhost:9092 > /dev/null 2>&1"]
      interval: 10s
      retries: 10

  ml-scorer:
    build: ./ml-scorer
    ports: ["8000:8000"]
    healthcheck:
      test: ["CMD", "python", "-c", "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')"]
      interval: 5s
      retries: 10

  ml-feedback:                              # v2.0, optional (Zheng)
    build: ./ml-scorer
    command: ["python", "-m", "ml_scorer.feedback.collector"]
    environment:
      KAFKA_BOOTSTRAP_SERVERS: kafka:19092
    depends_on:
      kafka: { condition: service_healthy }

  risk-engine:
    build: ./backend
    ports: ["8081:8081"]
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/sentinel
      SPRING_DATASOURCE_USERNAME: sentinel
      SPRING_DATASOURCE_PASSWORD: sentinel
      SPRING_KAFKA_BOOTSTRAP_SERVERS: kafka:19092
      RISK_ML_BASE_URL: http://ml-scorer:8000
    depends_on:
      postgres: { condition: service_healthy }
      kafka: { condition: service_healthy }
      ml-scorer: { condition: service_healthy }

  payment-gateway:
    build: ./payment-gateway
    ports: ["8080:8080"]
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/gateway
      SPRING_DATASOURCE_USERNAME: sentinel
      SPRING_DATASOURCE_PASSWORD: sentinel
      SPRING_KAFKA_BOOTSTRAP_SERVERS: kafka:19092
      GATEWAY_RISK_BASE_URL: http://risk-engine:8081
      SPRING_PROFILES_ACTIVE: demo          # 3-minute review timeout, seed merchants
    depends_on:
      postgres: { condition: service_healthy }
      kafka: { condition: service_healthy }
      risk-engine: { condition: service_started }

  frontend:
    build: ./frontend                       # nginx: /api/v1/payments & /api/v1/ops → payment-gateway:8080, other /api → risk-engine:8081
    ports: ["3000:80"]
    depends_on: [risk-engine, payment-gateway]

  kafka-ui:                                 # Could
    image: ghcr.io/kafbat/kafka-ui:latest
    ports: ["8085:8080"]
    environment:
      KAFKA_CLUSTERS_0_NAME: local
      KAFKA_CLUSTERS_0_BOOTSTRAPSERVERS: kafka:19092
    depends_on: [kafka]
```

**v3.0 additions to the target compose file:**

```yaml
  llm-insights:                             # API + Kafka consumer in one container
    build: ./llm-insights
    ports: ["8001:8001"]
    environment:
      DATABASE_URL: postgres://…@postgres:5432/llm      # credentials from .env
      KAFKA_BOOTSTRAP_SERVERS: kafka:19092
      RISK_ENGINE_BASE_URL: http://risk-engine:8081
      LLM_PROVIDER: stub                    # StubProvider: deterministic, no network, no cost
    depends_on:
      postgres: { condition: service_healthy }
      kafka: { condition: service_healthy }
```

`docker/postgres/init/01-create-databases.sql` creates the `gateway` and `llm` databases. The committed `docker-compose.yml` contains PostgreSQL 18, Kafka, the Risk Engine M0 health service and (profile `tools`) Kafka UI; later scaffold PRs add their services. At M0, Risk Engine has no database/Kafka/ML dependency; the listing above remains the full integration target. Unlike the listing above, the committed file reads the PostgreSQL credentials from `.env` rather than hard-coding them.

### 12.2 Environment variables

| Variable | Component | Default (local) |
|---|---|---|
| `SPRING_DATASOURCE_*` | risk-engine, payment-gateway | see compose |
| `SPRING_KAFKA_BOOTSTRAP_SERVERS` | risk-engine, payment-gateway | `localhost:9092` |
| `RISK_ML_BASE_URL` | risk-engine | `http://localhost:8000` |
| `GATEWAY_RISK_BASE_URL` | payment-gateway | `http://localhost:8081` |
| `GATEWAY_RISK_REVIEW_TIMEOUT` | payment-gateway | `30m` (`3m` in `demo` profile) |
| `MODEL_PATH`, `LOG_LEVEL` | ml-scorer | `models/model.joblib`, `INFO` |
| `KAFKA_BOOTSTRAP_SERVERS` | ml-feedback | `localhost:9092` |
| `VITE_USE_MOCKS`, `VITE_DEMO_MERCHANT_KEY` | frontend | `false`, test key from README |
| `LLM_PROVIDER` | llm-insights | `stub` (`bedrock` in staging) |
| `LLM_MODEL_ID`, `LLM_DAILY_BUDGET_USD`, `LLM_SAMPLE_RATE` | llm-insights | set per environment; staging values in SSM Parameter Store |
| `RISK_ENGINE_BASE_URL` | llm-insights | `http://localhost:8081` |
| `COGNITO_ISSUER_URI`, `COGNITO_CLIENT_ID` | all backends, frontend | shared dev/staging pool (Terraform outputs) |

### 12.3 End-to-end scenarios

**Release 1 (v1.0) — Risk Engine**

| # | Scenario | Expected |
|---|---|---|
| E1 | Normal Irish €49.99 purchase, known customer | APPROVE, riskScore < 40 |
| E2 | €7,500 from usual country, customer whose 30-day average is ~€50 | `AMOUNT_ABOVE_THRESHOLD` + high ML score → REVIEW or DECLINE |
| E3 | Blocklisted customer | DECLINE, riskScore 100, `hardDecline` |
| E4 | 6 transactions in 10 minutes | 6th has `VELOCITY_1H` |
| E5 | Same request sent twice | Same `assessmentId`; audit `IDEMPOTENT_REPLAY` |
| E6 | Same `transactionId`, different amount | 409 `IDEMPOTENCY_CONFLICT` |
| E7 | Stop `ml-scorer`, send E1 | 200, `degraded = true`, `ML_UNAVAILABLE` |
| E8 | Review a REVIEW case in the UI | `REVIEWED`; audit `REVIEWED`; leaves the queue |
| E9 | Review the same case again | 409 shown in UI |

**Release 2 (v2.0) — Sentinel Pay**

| # | Scenario | Expected |
|---|---|---|
| P1 | €49.99, `tok_visa_success`, automatic capture | 201 `CAPTURED`; `PaymentAuthorized` + `PaymentCaptured` on Kafka; risk assessment shows `paymentStatus = CAPTURED`; ledger balanced |
| P2 | Manual capture: create → capture €30 of €50 | `AUTHORIZED` → `CAPTURED`, `amountCaptured = 30` |
| P3 | `tok_insufficient_funds` | `DECLINED`, `INSUFFICIENT_FUNDS` |
| P4 | Blocklisted customer | `DECLINED`, `RISK_DECLINED`; acquirer never called |
| P5 | REVIEW-level payment → analyst APPROVE in UI | `PENDING_RISK_REVIEW` → (event) → `CAPTURED` within ~2 s of the review |
| P6 | REVIEW-level payment → analyst DECLINE | `DECLINED`, `RISK_REVIEW_REJECTED` |
| P7 | REVIEW-level payment, nobody reviews (demo profile) | After 3 min: `DECLINED`, `RISK_REVIEW_TIMEOUT` |
| P8 | Same `Idempotency-Key` + same body sent twice | Same payment, `Idempotent-Replayed: true`, one ledger journal only |
| P9 | Same key, different amount | 409 `IDEMPOTENCY_KEY_REUSED` |
| P10 | Stop `risk-engine`; pay €20, then €500 | €20 `CAPTURED` with `fallbackApplied`; €500 `DECLINED` `RISK_UNAVAILABLE` |
| P11 | Stop `kafka`; make 3 payments; start `kafka` | Payments succeed; events appear after restart; risk UI catches up |
| P12 | Refund €10 of a captured €49.99 with reason `FRAUDULENT` | `PARTIALLY_REFUNDED`; risk assessment `fraudConfirmed = true`; (optional) feedback collector stores label 1 |
| P13 | Refund more than captured | 409 `REFUND_EXCEEDS_CAPTURED` |
| P14 | Cancel a `CAPTURED` payment | 409 `INVALID_PAYMENT_STATE` |

**v3.0 scope — LLM insight step**

| # | Scenario | Expected |
|---|---|---|
| L1 | REVIEW-level payment with `StubProvider` | One `llm_invocation` with status `SUCCESS`; `GET /api/v1/insights/{assessmentId}` returns the summary; `RiskInsightGenerated` on `risk.insights.v1` |
| L2 | Stub configured to return malformed JSON | Invocation stored as `INVALID_OUTPUT` with the raw response and validation errors; no event; no crash; the consumer keeps running |
| L3 | Provider unavailable (stub raises / Bedrock unreachable) | Payments and reviews unaffected; invocation stored with status `ERROR` after retries; UI shows "No AI summary available" |
| L4 | Daily budget set to 0 | No provider calls; nothing published; the skip is logged and counted |

**v3.0 scope — UI (Playwright):** homepage renders and its CTAs work; a `/sample` scenario plays through to a decision; an unauthenticated visit to `/product` redirects to `/login?returnTo=/product`; `/dashboard` shows the merchant or the analyst variant according to the role.

Automated with Newman (`e2e/sentinel-pay.postman_collection.json`) plus a short shell script that stops/starts containers for P10–P11. P5–P7 include a UI step (Jiajun).

### 12.4 Demo scripts

**Risk Engine demo (≈ 10 min, at M1):** compose up → dashboard → simulator presets E1–E3 → review a case + audit trail → stop ML, show degraded → model card → CI and a reviewed PR.

**Sentinel Pay demo (≈ 15 min, at M2):**

1. Architecture slide (Section 4.1) — "sync for decisions, async for everything else".
2. Demo checkout: P1 → show payment timeline, ledger, linked risk assessment, Kafka messages in Kafka UI.
3. P5: a held payment; approve it in the review queue; watch it capture.
4. P8: resend with the same Idempotency-Key — no double charge.
5. P10 + P11: kill risk-engine, then Kafka — the platform degrades gracefully and recovers.
6. P12: fraud refund flows back to the Risk Engine (and the ML feedback store).
7. Close with tests/CI and the roadmap.

**Release demo (at M5):** scripted during M5 — website → `/sample` → sign-up and login → a real payment on staging → a held payment reviewed with its AI summary → LLM Console → the pipeline, the AWS architecture and the cost story.

---

## 13. LLM insight service design — proposed owner: Zheng Liu (milestone M4)

> **Working Backwards.** *Customer:* a risk analyst working the review queue. *Problem:* every REVIEW case arrives as a score, a list of rule codes and three ML factors; the analyst has to read them all and reconstruct the story before deciding, which is slow and inconsistent between analysts. *Solution:* each REVIEW case comes with a two-to-four-sentence summary of why it was flagged, the key signals, a suggested action with a confidence level and explicit caveats — clearly labelled as AI-generated and advisory. The analyst still decides; the summary only saves reading time. Developers get a console that shows every LLM call, so quality and cost stay visible.

### 13.1 Principles

1. **Advisory only.** The LLM never approves, declines or changes a payment or risk decision. `suggestedAction` is text for a human, never an input to the state machines of Sections 7.7 and 10.3.
2. **Off the decision path.** The step is an asynchronous Kafka consumer. The workflow behaves identically when it is down.
3. **No personal data in prompts.** Amounts, rule hits, ML factors and aggregated customer context only; IDs are pseudonymous. No names, emails or card data.
4. **Everything is recorded.** Each call stores its rendered prompt, raw response, tokens, cost and outcome.
5. **Cost is bounded.** Token limits per call and a daily budget across all calls.
6. **CI never calls a paid API.** `StubProvider` is the default everywhere except staging.

### 13.2 Tech stack

| Concern | Choice |
|---|---|
| Runtime | Python 3.12, managed with **uv** |
| Framework | FastAPI + Pydantic v2, served by Uvicorn on port 8001 (ADR-0009) |
| Persistence | SQLAlchemy on its own PostgreSQL database `llm`; schema changes through **Alembic** migrations |
| Output validation | **Pydantic v2** model for the LLM's JSON output |
| LLM access | boto3 Bedrock Runtime, **Converse API**; model ID from configuration, defaulting to a fast, low-cost Claude model on Bedrock |
| Kafka | `confluent-kafka` consumer and producer |
| Auth | Cognito JWT validated against the pool's JWKS (Section 14.3) |
| Quality | pytest, httpx `TestClient`, ruff, mypy; moto or a stubbed boto3 client for AWS calls |

**One container.** The Kafka consumer runs inside the service as a background task started from the FastAPI lifespan handler (a worker thread around the blocking consumer loop — proposed), so `llm-insights` stays within its single 256 MB container in the staging budget (Section 19.2). If the consumer ever needs to scale or restart independently of the API, it moves to its own process from the same image (Q13).

### 13.3 Trigger and selection

- Consumes `RiskAssessmentCreated` from `risk.assessments.v1` (consumer group `llm-insights.assessments`, proposed name). `RiskAssessmentReviewed` is ignored.
- Generates an insight for **every `REVIEW`** decision, plus a configurable sample (`LLM_SAMPLE_RATE`) of `APPROVE` / `DECLINE` decisions for quality monitoring.
- **Idempotent on `assessmentId`:** a redelivered event, or an assessment that already has an invocation, is skipped. Like every consumer in this system, it acknowledges only after its database transaction commits (Section 11.4).

### 13.4 Input and prompts

- The event carries identifiers; the service fetches the details from the Risk Engine (`GET /api/v1/risk-assessments/{id}`): amount, currency, country, rule hits, ML score and factors, customer context, degraded flag.
- A mapping function builds the prompt input from an **allow-list** of fields, so a new field on the assessment never reaches the LLM by accident.
- Prompts are versioned files: `llm-insights/prompts/<name>/v<N>.md`. A prompt is never edited in place; a change is a new version. Every invocation records `promptName` and `promptVersion`.

### 13.5 Output

Structured JSON, validated with Pydantic:

| Field | Type | Notes |
|---|---|---|
| `summary` | string | 2–4 sentences for the analyst |
| `keySignals` | string[] | The facts that drove the assessment |
| `suggestedAction` | `APPROVE` \| `DECLINE` \| `NEEDS_MORE_INFO` | Advisory |
| `confidence` | `LOW` \| `MEDIUM` \| `HIGH` | The model's own stated confidence, not a calibrated probability |
| `caveats` | string[] | What the model could not see or is unsure about |

### 13.6 Provider abstraction

```python
class LlmProvider(Protocol):
    def generate(self, prompt: RenderedPrompt, limits: Limits) -> LlmResult: ...
    # LlmResult: raw_text, input_tokens, output_tokens, model, latency_ms
```

| Provider | Used in | Behaviour |
|---|---|---|
| `BedrockProvider` | staging | Bedrock Converse API through boto3. The instance role allows `bedrock:InvokeModel` on the configured model ARN only |
| `StubProvider` | local development, CI | Deterministic output derived from the input; can be told to return malformed JSON or raise, for scenarios L2 and L3. No network, no cost |

### 13.7 Guardrails

| Guardrail | Rule |
|---|---|
| Timeout and retries | 10 s per call, 2 retries |
| Output validation | JSON parsed and validated against the schema of Section 13.5; invalid output is **stored** with status `INVALID_OUTPUT` and never shown to analysts |
| Token limits | Maximum input and output tokens per call |
| Daily cost budget | Once the day's estimated cost reaches the budget, stop calling the provider and publish nothing until the next day |
| Idempotency | One insight per `assessmentId` (Section 13.3) |
| Failure isolation | Any provider or validation failure ends in a stored invocation row; it never propagates to the Risk Engine or the gateway |

Invocation status: `SUCCESS`, `INVALID_OUTPUT`, `ERROR` (provider failure or timeout after retries). Whether "skipped because over budget" is stored as a row or only counted is open (Q14).

### 13.8 Persistence (database `llm`)

| Table | Columns |
|---|---|
| `llm_invocation` | `id`, `assessmentId`, `model`, `promptName`, `promptVersion`, `renderedPrompt`, `rawResponse`, `parsedOutput`, `status`, `latencyMs`, `inputTokens`, `outputTokens`, `estCostUsd`, `errorMessage`, `createdAt` |
| `insight_feedback` | `invocationId`, `rating` (`UP` / `DOWN`), `comment`, `userId`, `createdAt` |

Column names are snake_case in the database and camelCase in the API. `userId` is the Cognito `sub`, not a name or email. The insight served to analysts is the `parsedOutput` of the latest `SUCCESS` invocation for the assessment; whether a separate `risk_insight` table is worth having is open (Q14).

### 13.9 APIs and event

- REST: Section 6.6. Contract first, in `contracts/openapi-llm-insights-v1.yaml`.
- Event: `RiskInsightGenerated` on `risk.insights.v1`, added to `contracts/asyncapi-events-v1.yaml` as an additive change. It uses the standard envelope of Section 6.5 and is published only for `SUCCESS` invocations, written through an outbox row in the same transaction as the invocation (Section 11.3).

### 13.10 Project structure (Proposed)

```text
llm-insights/
├── pyproject.toml / uv.lock
├── alembic.ini
├── migrations/                      # Alembic revisions
├── prompts/
│   └── case_summary/v1.md           # versioned prompt files
├── src/llm_insights/
│   ├── api/
│   │   ├── main.py                  # FastAPI app, lifespan (starts the consumer), routers
│   │   ├── routes/                  # insights.py, invocations.py, stats.py, feedback.py — thin, no business logic
│   │   ├── schemas.py               # Pydantic models = openapi-llm-insights-v1.yaml
│   │   └── auth.py                  # Cognito JWT dependency + role checks
│   ├── db/                          # models.py (LlmInvocation, InsightFeedback, OutboxEvent), session.py
│   ├── services/
│   │   ├── generate.py              # select → budget → fetch → render → call → validate → save
│   │   ├── prompt.py                # load and render versioned prompts
│   │   ├── output.py                # Pydantic output model + parsing
│   │   ├── budget.py                # daily cost budget
│   │   └── stats.py                 # aggregates for /api/v1/llm/stats
│   ├── providers/                   # base.py (LlmProvider), bedrock.py, stub.py
│   ├── clients/risk_engine.py       # typed client for the Risk Engine API
│   ├── consumer.py                  # Kafka loop for risk.assessments.v1
│   └── settings.py                  # pydantic-settings
├── tests/
└── Dockerfile
```

### 13.11 LLM Console (`/internal/llm`, `developer` / `admin`)

| View | Content | Priority |
|---|---|---|
| Overview | Calls per day; success / invalid-output / error rate; p50 / p95 latency; tokens and estimated cost per day; breakdown by prompt version and model; analyst feedback ratio | Should |
| Invocations table | Time, assessment, model, prompt version, status, latency, tokens, cost. Filterable | Should |
| Invocation detail | Rendered prompt and raw response side by side; parsed output; validation errors; link to the assessment; analyst feedback | Should |
| Prompt comparison | Metrics for two prompt versions side by side | Could |

### 13.12 Testing

- **Unit:** prompt rendering (including the field allow-list), output parsing and validation, selection and sampling, budget arithmetic, idempotency.
- **Integration:** consumer against Testcontainers Kafka and PostgreSQL with `StubProvider`; Risk Engine client against recorded contract examples; Bedrock adapter against moto or a stubbed boto3 client.
- **Contract:** responses validated against `openapi-llm-insights-v1.yaml`.
- **End-to-end:** scenarios L1–L4 (Section 12.3).
- Coverage target ≥ 80 % on `services/` and `providers/`.

### 13.13 Observability and cost

- Structured JSON logs with `X-Request-Id` / `correlationId`, `assessmentId`, status, latency and token counts. **Never** log prompts or responses; they live in the database only.
- CloudWatch alarms on LLM error rate and on daily estimated cost (Section 19.2).
- Runbook: `docs/runbooks/llm-insights.md` (to be written at M4).

---

## 14. Authentication & roles (v3.0, milestone M3)

> **Working Backwards.** *Customer:* a merchant who signs up to try the product, and an analyst who reviews cases. *Problem:* in design v2.0 the ops and analytics endpoints were open and the reviewer was whoever typed a name into a settings page; that is acceptable on a laptop but not on a public URL. *Solution:* one sign-in for the website and the product. Each person sees only what their role allows, a merchant sees only its own data, and every review is attributed to an authenticated user.

### 14.1 Identity provider

- **Amazon Cognito user pool.** There is one shared **dev/staging pool**; local development uses the same pool, so there is no local identity provider to maintain.
- Callback and logout URLs: the CloudFront domain and `http://localhost:5173`.
- Sign-up and login use the Cognito Hosted UI (redirect) or an embedded flow — Jiajun chooses in M3.

### 14.2 Roles

Roles are Cognito **groups**, delivered in the `cognito:groups` claim.

| Role | How it is assigned | Can do |
|---|---|---|
| `merchant` | Default on sign-up | Create and view **own** payments, manage own API keys, merchant dashboard |
| `analyst` | By an admin | Review queue, assessment search and detail, ops payment views, analytics dashboard, feedback on AI summaries |
| `admin` | By an admin | Everything an analyst can do, blocklist management, role assignment, LLM Console |
| `developer` | By an admin | LLM Console (`/internal/llm`) and LLM invocation APIs |

Only an admin assigns non-merchant roles.

### 14.3 Token flow

```text
Browser ── /login ──▶ Cognito (Authorization Code + PKCE) ──▶ back to the app with tokens held in memory
   │
   │  Authorization: Bearer <JWT>
   ├──▶ payment-gateway   Spring Security OAuth2 Resource Server: validate signature, issuer, expiry; map cognito:groups → roles
   ├──▶ risk-engine       same
   └──▶ llm-insights      FastAPI dependency: validate against the Cognito JWKS; map cognito:groups → permissions
```

- **Frontend:** OIDC Authorization Code + PKCE with `react-oidc-context` / `oidc-client-ts`. Tokens are kept **in memory**; never in `localStorage`.
- **Java services:** Spring Security OAuth2 Resource Server validates Cognito JWTs and maps the `cognito:groups` claim to roles.
- **`llm-insights`:** validates JWTs with the Cognito JWKS.
- **`ml-scorer`** has no public route; it is reachable only from the Risk Engine inside the Docker network / host.

### 14.4 Merchant provisioning

On a merchant's first login the frontend calls `POST /api/v1/merchants/me`. The gateway creates the merchant record linked to the Cognito `sub` (or returns the existing one — the call is idempotent). API keys are then created from `/product`.

### 14.5 Authorisation rules

| Surface | Credential | Rule |
|---|---|---|
| `POST/GET /api/v1/payments/**` (programmatic) | `X-API-Key` | Unchanged: server-to-server merchant calls |
| Merchant web views | JWT, role `merchant` | Scoped to the merchant linked to the token's `sub` |
| `/api/v1/ops/**`, analytics and stats endpoints | JWT, role `analyst` / `admin` | **No longer unauthenticated** |
| Review, blocklist | JWT, role `analyst` / `admin` (blocklist writes: `admin`, proposed) | Reviewer = the token's `sub` / username claim |
| `/api/v1/insights/**` | JWT, role `analyst` / `admin` | |
| `/api/v1/llm/**` | JWT, role `developer` / `admin` (feedback: `analyst` / `admin`) | |
| Health endpoints | none | Liveness only, no data |

- **Tenant rule:** a user only sees their own merchant's data. Cross-tenant access returns **404, not 403** — do not reveal that the resource exists.
- **Service-to-service calls** (gateway → risk-engine, risk-engine → ml-scorer, llm-insights → risk-engine) stay inside the private network. How the Risk Engine distinguishes them from browser calls once its API requires a JWT is open (Q12).
- Role checks in the frontend are a convenience. Every backend enforces them.

### 14.6 Testing

- Java: `@WebMvcTest` with mocked JWTs for each role; 401 without a token, 403 for the wrong role, 404 across tenants.
- Python: FastAPI tests with a locally generated key pair and JWKS; the same three cases.
- Playwright: login redirect and the role-based dashboard.
- The threat model (`docs/threat-model.md`) is updated in the same PR that adds each new entry point.

---

## 15. Non-functional requirements

| Category | Requirement | Verified by |
|---|---|---|
| Performance | Risk p95 < 250 ms; **gateway create-payment p95 < 600 ms** incl. risk + simulated acquirer (50–150 ms); ML p95 < 50 ms | Load script (100 sequential requests) |
| Resilience | ML down → rules-only; Risk down → fallback policy; Kafka down → outbox buffers | E7, P10, P11 |
| Correctness of money | Idempotent money-moving endpoints; DB `CHECK` constraints on captured/refunded; `BigDecimal` + `NUMERIC`; balanced ledger | P8, P13, ledger tests |
| Consistency | No lost events (outbox); duplicates harmless (inbox); per-payment ordering (keying) | Testcontainers Kafka tests, P11 |
| Event latency | Review decision → payment captured < 3 s (p95, local) | P5 |
| Auditability | Append-only audit events (risk), status history + ledger (gateway); every log line has `X-Request-Id` | E5, P1 |
| Security | API keys hashed; tenant scoping (404 for other merchants); no PAN; input validation; secrets in SSM Parameter Store (never in Git, images or task definitions); Dependabot, CodeQL, Trivy | Tests, review, CI |
| Explainability | Reason codes + ML factors on every assessment | E2, E3 |
| Honesty | Synthetic data, simulated acquirer and illustrative fees labelled in README and demo | Review |
| LLM isolation | Payment and risk behaviour is identical with the LLM step down; no insight within the decision path | L3 |
| LLM cost | Per-call token limits and a daily budget; calls stop when the budget is reached | L4, cost alarm |
| Privacy | No names, emails or card data in prompts, logs or events; pseudonymous IDs only | Prompt allow-list test, review |
| Access control | Role-based access enforced in every backend; cross-tenant access → 404; tokens never in `localStorage` | Auth tests, Playwright |
| Availability (staging) | Usable within 5 minutes of a scheduled or manual start; website and `/sample` available at all times | `make aws-wake`, smoke test |
| Cost (staging) | About $20–28 per month; AWS Budgets alerts at $15 (forecast) and $25 (actual) | Budgets alerts |
| Accessibility | WCAG 2.1 AA on the website and web app | Keyboard and contrast checks, review |
| Operability | Health endpoint, JSON logs with `X-Request-Id`, at least one alarm and a runbook per service | ORR checklist |

---

## 16. Risks & mitigations

| Risk | Impact | Likelihood | Mitigation | Owner |
|---|---|---|---|---|
| **Jiawei overloaded** (tech lead + two services ≈ 26 h + 35 h) | High | High | Drop order in 10.11; teammates take E2E tests/Newman; start gateway skeleton in v1.0 buffer; keep Should items optional | Jiawei |
| Integration squeezed into last days | High | High | Mocks from day 1; mid-sprint hand-offs (H2/H3, H7/H8); feature freezes on Thursdays | Jiawei |
| Contract drift (4 contracts now) | High | Medium | Generated types, schema-validated tests, CODEOWNERS on `contracts/`, AsyncAPI sample events in `e2e/events/` | Jiawei |
| Distributed-state bugs (held payments, races) | High | Medium | Single state machine, optimistic locking, inbox dedupe, Testcontainers Kafka tests, P5–P7 | Jiawei |
| Kafka setup friction on Windows/Docker Desktop | Medium | Medium | Pinned image + listener config in 12.1; Testcontainers for tests; console-consumer cheatsheet | Jiawei |
| UCD assessment period in December | Medium | Medium | Q7; no sprint is planned across the exam and holiday weeks (see `docs/ROADMAP.md`) | All |
| Training–serving skew | Medium | Medium | Shared `features.py`; H4 parity check | Zheng |
| AI-generated code with outdated APIs (Boot 3, old Spring Kafka, old React) | Medium | High | Section 5.8 rules; check official docs | All |
| Spring Boot 4 library compatibility | Medium | Medium | Prefer core libraries; check release notes; fallback to Boot 3.5 only if blocked (both services together) | Jiawei |
| **Scope has roughly doubled** (website, auth, LLM, AWS on top of v2.0) | High | High | Milestones M0–M5 with a walking skeleton first; Should/Could items are cut before dates move; re-plan weekly in `docs/ROADMAP.md` | Jiawei |
| LLM returns wrong or misleading summaries | Medium | Medium | Advisory label, schema validation, caveats field, analyst feedback, sampling of non-REVIEW cases, LLM Console | Zheng |
| LLM cost runaway | Medium | Low | Token limits, daily budget, cost alarm, `StubProvider` outside staging | Zheng |
| AWS bill surprise | Medium | Medium | Budgets alerts in the first apply, scheduled stop, resource tags, no NAT Gateway or ALB | Jiawei |
| Single staging host fails or runs out of memory (4 GB) | Medium | Medium | Container memory limits, 2 GB swap, EBS snapshots and `pg_dump`; move to t4g.large if OOMs appear | Jiawei |
| Bedrock model access not enabled in time | Medium | Medium | Request access during M0; everything is testable with `StubProvider` | Jiawei |
| Authentication retrofitted onto endpoints designed as open | High | Medium | Contract changes first (Section 6.7); role tests per endpoint; threat model update | Jiawei |
| Three services' worth of secrets and config | Medium | Medium | SSM Parameter Store, GitHub OIDC, `.env.example` only, CodeQL and Trivy | Jiawei |

---

## 17. Roadmap after the first release

| Theme | Highlights |
|---|---|
| Merchant & security | Merchant **webhooks** (signed with HMAC, retries), Redis velocity counters, OpenTelemetry tracing across gateway → risk → ML → LLM, Prometheus + Grafana |
| Payments depth | **3-D Secure / SCA simulation** (PSD2 — highly relevant for EU/Irish payments), daily **settlement & reconciliation** batch (ledger vs acquirer report), multi-acquirer routing with failover |
| Risk depth | Rule management UI with versioning and shadow mode, SHAP explanations, MLflow model registry, champion/challenger models |
| AI depth | Prompt evaluation sets and regression tests, prompt comparison in the console, analyst-feedback-driven prompt iteration |
| Production shape | Fargate services behind an ALB, RDS Multi-AZ, MSK, own domain with TLS to the origin (Section 19.5); feeds the AI-driven SRE / anomaly-detection project |

Authentication (was v2.1, Keycloak) and cloud deployment (was Phase 3) moved **into** the first release; see Sections 14 and 19.

---

## 18. Open questions

Due dates are tracked in `docs/ROADMAP.md`. Q1–Q9 are carried over from design v2.0.

| # | Question | Owner |
|---|---|---|
| Q1 | *Closed 11 Nov 2026:* GitHub handles are `@jiajunxiao-work` (Jiajun) and `@zliu-59` (Zheng) | — |
| Q2 | Weekly availability of each member (~10–13 h assumed) | All |
| Q3 | 50/50 rule/ML weighting, or rules-dominant (0.6/0.4)? | Jiawei + Zheng |
| Q4 | Team chat tool | All |
| Q5 | Repo under Jiawei's account or a GitHub organisation? | Jiawei |
| Q6 | Rename the repo from `SentinelRiskEngine` to `sentinel-pay`? (GitHub redirects old URLs) | Jiawei |
| Q7 | December assessment dates — which weeks are unavailable? | All |
| Q8 | Do Jiajun and Zheng take the proposed gateway-scope tasks (8.7, 9.10)? | Jiajun, Zheng |
| Q9 | Gateway fallback limit (EUR 100) and illustrative fee (1.4 % + 0.25) — keep? | Jiawei |
| Q10 | Milestones M0–M5 and their dates in `docs/ROADMAP.md` — sign-off | All |
| Q11 | *Closed 11 Nov 2026:* the Python services use FastAPI; Django was rejected (ADR-0009) | — |
| Q12 | Service-to-service authentication once the Risk Engine API requires a JWT (network-only trust, a shared internal header, or Cognito client credentials) | Jiawei |
| Q13 | Does Zheng own `llm-insights`? Does its Kafka consumer stay inside the web process or get its own container? | Zheng + Jiawei |
| Q14 | LLM persistence details: separate `risk_insight` table or latest successful invocation; is a budget skip stored as a row? | Zheng |
| Q15 | *Closed 14 Nov 2026:* the frontend uses Tailwind CSS + shadcn/ui with our own design tokens; MUI is not used (ADR-0010) | — |
| Q16 | *Closed 13 Nov 2026:* Zheng wrote `openapi-ml-scorer-v1.yaml` (RISK-140); it freezes at H1 | — |
| Q17 | *Closed 11 Nov 2026:* the repository is MIT-licensed (`LICENSE`) | — |
| Q18 | *Closed 16 Nov 2026:* Java 21 + Spring Boot 4.1.2 selected for the backend scaffold (ADR-0008); gateway follows the same line | — |
| Q19 | Bedrock model ID and whether new-account AWS credits are available | Jiawei |
| Q20 | ADR numbering: design v2.0 used 0001 for "tech stack"; 0001 is now "record architecture decisions" and the stack decision moves to 0008 — accept? | Jiawei |
| Q22 | Can this Free-plan project call Bedrock Claude models through cross-Region inference profiles, and how are EBS snapshots automated without DLM? (ADR-0015) | Jiawei — RISK-108 |
| Q21 | *Resolved 23 Nov 2026:* the repository is public, so GitHub environment protection is available. `staging` now requires a reviewer (Zheng or Jiajun) with self-review prevented and allows only `main`; `infra/scripts/deployment_gate.py` verifies this before any AWS access. History: private-plan rulesets returned 403 (19 Nov) and required reviewers returned 422 (20 Nov). Branch rulesets on `main` are still to be configured (RISK-101) | Jiawei |

---

## 19. AWS architecture (staging) — single-host ECS with scheduled start/stop

**Decision (ADR-0007, accepted):** run all backend containers with **ECS on one EC2 Graviton instance**, and start and stop it on a schedule. Keep managed AWS services where they are cheap or free (S3, CloudFront, Cognito, Bedrock, ECR). Production would use Fargate + ALB + Multi-AZ RDS; that is the documented migration path, not the current build. Region: **eu-north-1 (Stockholm)**, the Region the team's AWS project is locked to (ADR-0015).

Nothing in this section exists yet. It is built at milestone M0, with `terraform plan` reviewed in PRs and every `terraform apply` explicitly approved.

### 19.1 Topology

```text
Browser ──HTTPS──▶ CloudFront (dxxxx.cloudfront.net)
                     ├── /*        → S3 bucket (React build, Origin Access Control)
                     └── /api/*    → EC2 origin (Elastic IP DNS, HTTP :80)
                                      SG: inbound :80 only from the CloudFront origin-facing
                                      managed prefix list + secret header checked by nginx
EC2 t4g.small now (ARM64, 2 GB; Free plan, ADR-0016) → t4g.medium (4 GB) for the full stack; ECS-optimised AL2023, public subnet, Elastic IP
 └── ECS cluster "sentinel-staging" (EC2 capacity, bridge networking, static host ports)
      ├── nginx (:80)            path routing → services below; rejects requests without the CloudFront secret header
      ├── payment-gateway (:8080)   risk-engine (:8081)   ml-scorer (:8000)   llm-insights (:8001)
      ├── ml-feedback (no port)
      ├── kafka (:9092, KRaft)   data on /data/kafka
      └── postgres (:5432)       data on /data/postgres  (databases: sentinel, gateway, llm)
 └── EBS gp3 30 GB root + EBS gp3 20 GB data volume mounted at /data
Managed services: ECR · Cognito · Bedrock · SSM Parameter Store · CloudWatch Logs/Alarms · EventBridge Scheduler · DLM snapshots · AWS Budgets
```

### 19.2 Components and choices

| Concern | Choice | Notes |
|---|---|---|
| IaC | **Terraform**, remote state in S3 (+ DynamoDB lock, or S3 native locking if the provider version supports it — check) | Modules: `network`, `ecs-ec2-host`, `ecs-service`, `ecr`, `cdn`, `cognito`, `scheduler`, `observability`, `github-oidc` |
| Compute | One **t4g.small** On-Demand instance while the project is on the AWS Free plan (ADR-0016; Terraform variable `instance_type`), **t4g.medium** for the full stack, **standalone (not an Auto Scaling Group)** so stop/start keeps its EBS volumes and data | AMI from SSM parameter `/aws/service/ecs/optimized-ami/amazon-linux-2023/arm64/recommended/image_id`; user data registers it to the ECS cluster and mounts `/data`; 2 GB swap file as a safety net |
| Container orchestration | **ECS on EC2**, one ECS service per component, **bridge** network mode with static host ports | `minimumHealthyPercent = 0`, `maximumPercent = 100` (one host + static ports means a short restart per deploy — accepted, documented). Deployment circuit breaker with rollback enabled |
| Service-to-service calls | Via the host: services call each other at `http://<docker0 gateway>:<port>` (e.g. `172.17.0.1:8000`) set through env vars | Service Connect is the cleaner option but its Envoy sidecars cost ~50 MB each; revisit if memory allows |
| Images | **ARM64 only** (`linux/arm64`), built on GitHub-hosted ARM runners or with `docker buildx`; stored in **ECR** with scan-on-push and a lifecycle policy (keep last 10) | Verify every base image (Kafka, Postgres, Python, JRE) publishes `linux/arm64` |
| Database | **PostgreSQL 18 container** on the data volume | Nightly `pg_dump` to a private S3 bucket (7-day lifecycle) + daily EBS snapshots via **Data Lifecycle Manager** (keep 7). Upgrade path: RDS |
| Kafka | **Single-broker KRaft container** on the data volume | MSK is too costly; outbox tables remain the source of truth |
| Ingress | **CloudFront** for HTTPS on the default `*.cloudfront.net` domain; nginx on the instance as reverse proxy | CloudFront → origin is HTTP, locked to the CloudFront prefix list + secret header (stored in SSM). Upgrade path: own domain + TLS to origin. No ALB (saves ~$18/month) |
| Static IP | One **Elastic IP** so the CloudFront origin hostname survives stop/start | Billed hourly whether the instance runs or not (~$3.6/month) |
| Auth | Cognito user pool, app client, Hosted UI domain; callback/logout URLs = the CloudFront domain + `http://localhost:5173` | Free tier covers this project |
| LLM | Amazon Bedrock; instance role allows `bedrock:InvokeModel` on the chosen model ARN only | Model access must be enabled in the account first |
| Secrets & config | **SSM Parameter Store** SecureString, injected as ECS task `secrets` | No secrets in task definitions, images or Git |
| Access | **No SSH.** SSM Session Manager only (instance role `AmazonSSMManagedInstanceCore`); the security group has no port 22 | |
| Observability | `awslogs` driver → CloudWatch Logs (**7-day retention**); alarms on EC2 status check, container restarts, nginx 5xx (from a logs metric filter), LLM error rate and daily cost; one CloudWatch dashboard | Alarms use `treat_missing_data = notBreaching` so scheduled downtime does not page anyone |
| Memory budget (4 GB) | gateway 512 MB · risk-engine 512 MB · kafka 768 MB (heap 512 MB) · postgres 384 MB · ml-scorer 256 MB · llm-insights 256 MB · ml-feedback 128 MB · nginx 32 MB · OS + ECS agent ~400 MB ≈ **3.3 GB** | Set container memory limits and JVM `-XX:MaxRAMPercentage=75`; if OOMs appear, move to t4g.large (record in ROADMAP). |

RISK-104 implements the private S3/OAC distribution and nginx ingress configuration;
no live endpoint is deployed yet. Static routes use a viewer-request SPA rewrite
only on the S3 behaviour; API errors are never rewritten into HTML/200. API caching
is disabled and Authorization/cookies/query strings are forwarded. The origin
header is stripped before upstream calls. The default CloudFront certificate
forces the AWS TLSv1 security policy; a stricter minimum requires an own domain
and ACM certificate. WAF is deferred for this budgeted portfolio environment,
not included or claimed as protection. Resource-local scan exceptions for SSE-S3
and no WAF expire 31 Jan 2027. Review these tradeoffs before public deployment.

### 19.3 Scheduled start/stop

| Item | Setting |
|---|---|
| Scheduler | **EventBridge Scheduler** (timezone `Europe/Dublin`) with two schedules calling EC2 `StartInstances` / `StopInstances` on the tagged instance |
| Window | **Now (development): every day 19:00–02:00.** **Demo window (from M5, RISK-117): Mon–Fri 09:00–23:00**, off at weekends. Values are the Terraform variables `start_cron` / `stop_cron` |
| Manual override | `make aws-wake` (start the instance, wait until all ECS services are steady) and `make aws-sleep` (stop the instance); both ask for confirmation. Use `aws-wake` before interviews and demos outside the window |
| Boot behaviour | The ECS agent re-registers the instance; services restart automatically (desired counts stay 1); postgres and kafka start first via container dependencies and health checks. Target: system usable **≤ 5 minutes** after start |
| Deploys while stopped | `deploy-staging.yml` checks the instance state; if stopped it starts it, deploys, runs smoke tests, and leaves it running until the next scheduled stop |
| Frontend | Always available (S3 + CloudFront). When the backend is asleep, the web app shows the "Demo environment is sleeping" banner (Section 8.8.3). `/sample` keeps working because it is fully client-side |

### 19.4 Cost (indicative — re-check with the AWS Pricing Calculator and record in `TECH_DECISIONS.md`)

| Item | Monthly |
|---|---|
| t4g.medium, ~14 h × 22 weekdays ≈ 310 h | ~$11–12 |
| EBS gp3 root 30 GB + data 20 GB | ~$4–5 |
| Elastic IP (charged 24/7) | ~$3.6 |
| EBS snapshots, S3 backups, ECR storage | ~$1–2 |
| CloudFront, S3 website, Cognito, CloudWatch (7-day logs) | ~$0–2 (mostly free tier) |
| Bedrock tokens (demo volume, budget-capped) | ~$1–3 |
| **Total** | **≈ $20–28/month**; the same setup running 24/7 ≈ $40–45 |
| *Now:* t4g.small, development window 7 h × 30 days ≈ 210 h (USD 0.0172/h) | ~$3.6 compute |

Prices were re-checked for eu-north-1 on 23 Nov 2026 (`t4g.medium` USD 0.0344/h, gp3 USD 0.0836/GB-month); the totals hold. The AWS project is on the Free plan with a USD 100 credit, which covers about four months (RISK-108). **AWS Budgets** alerts at **$15 (forecast)** and **$25 (actual)**, created in the very first apply. Every resource is tagged `project=sentinel-pay`, `owner`, `env=staging`.

### 19.5 Known trade-offs and the path to production

- Single host = no high availability; brief downtime per deploy; host failure means rebuild from snapshot. Acceptable for a demo environment.
- CloudFront → origin traffic is unencrypted HTTP, mitigated by the prefix-list rule and the secret header; production would use TLS to the origin (own domain + certificate).
- PostgreSQL and Kafka are self-managed: we own backups and upgrades.
- **Migration path to the production shape:** swap `ecs-ec2-host` for Fargate services behind an ALB, move PostgreSQL to RDS and Kafka to MSK. The `ecs-service` module and the task definitions stay largely the same.

### 19.6 AWS project constraints (ADR-0015)

The account is a project in the new AWS experience on the Free plan. Its constraints apply to everything in this section:

| Constraint | Effect on this design | Tracked in |
|---|---|---|
| One Region per project: eu-north-1 | All Regional resources in eu-north-1; Terraform variable `region` | RISK-107 |
| No cross-Region features | Bedrock Claude models in eu-north-1 are reachable only through cross-Region inference profiles, so LLM access is unconfirmed | RISK-108 |
| Data Lifecycle Manager not on the supported list | Daily EBS snapshots may need another mechanism | RISK-108 |
| WAF with CloudFront unavailable | WAF stays deferred | ADR-0007 |
| USD 100 credit; irreversible upgrade when it runs out or after six months | About four months of staging at the estimated rate | RISK-108, ROADMAP §7 |
| Only Free-Tier-eligible instance types (largest ARM64: t4g.small, 2 GiB) | M0 runs on t4g.small; the full stack needs the Paid plan or an x86 type | ADR-0016, RISK-108 |

### 19.7 Guard rails for changes

- `terraform plan` is always allowed. **`terraform apply`, starting or stopping the instance, and creating AWS resources need explicit approval** from the tech lead each time.
- No long-lived AWS keys anywhere: GitHub Actions assumes a role through OIDC; people use SSO or short-lived credentials.
- No hard-coded account IDs or ARNs in Terraform; modules take variables and expose outputs.

---

## Appendix A — AI-assisted development setup

The working agreement for AI coding assistants is the `CLAUDE.md` at the repository root, plus one `CLAUDE.md` per component folder with stack-specific commands and conventions. They replace the "Claude Project" instructions suggested in design v2.0. The policy for people is Section 5.8.

## Appendix B — Glossary

| Term | Meaning |
|---|---|
| Acquirer | The bank that processes card payments for a merchant (simulated here) |
| Authorisation / Capture | Authorisation reserves funds on the card; capture actually takes them |
| Void / Cancel | Releasing an authorisation before capture |
| Assessment | One scored transaction and its risk decision |
| Hard decline | A rule that forces DECLINE regardless of score |
| Degraded | Risk decision made without the ML score |
| Fallback (gateway) | Payment decision made without the Risk Engine |
| Idempotency key | Client-supplied key that makes retries safe (no double charge) |
| Outbox pattern | Writing events to a DB table in the same transaction as the business change, then publishing them |
| Inbox / idempotent consumer | Recording processed event IDs so duplicates have no effect |
| DLT | Dead-letter topic — where messages go after repeated processing failures |
| KRaft | Kafka's built-in consensus mode (replaces ZooKeeper) |
| Double-entry ledger | Every money movement recorded as balancing debits and credits |
| PR-AUC | Precision–recall area under curve; key metric when fraud is rare |
| Training–serving skew | Features computed differently in training vs production |
| PCI DSS | Card-data security standard; avoided here by never handling card numbers |
| SCA / 3-D Secure | Strong Customer Authentication required under PSD2 in the EU |
| RFC 9457 | Standard JSON format for HTTP API errors |
| AsyncAPI | The OpenAPI equivalent for event-driven / message-based APIs |
| ADR | Architecture Decision Record — a short file recording one decision, its options and consequences |
| ORR | Operational Readiness Review — a checklist a service must pass before release |
| Working Backwards | Amazon practice of starting a design from the customer and their problem |
| STRIDE | Microsoft threat-modelling categories: Spoofing, Tampering, Repudiation, Information disclosure, Denial of service, Elevation of privilege |
| LLM insight | An AI-generated, advisory summary of one risk assessment |
| StubProvider | Deterministic stand-in for the LLM used locally and in CI |
| Bedrock Converse API | Amazon Bedrock's model-independent chat API |
| Cognito group | A named set of users in a Cognito user pool; used here as a role |
| PKCE | Proof Key for Code Exchange — makes the OAuth authorisation-code flow safe for browser apps |
| JWKS | JSON Web Key Set — the public keys used to verify JWT signatures |
| OIDC (GitHub) | Lets a GitHub Actions run assume an AWS role without stored keys |
| OAC | Origin Access Control — lets only CloudFront read a private S3 bucket |
| Graviton | AWS's ARM64 processors (`t4g` instances) |
| Walking skeleton | The thinnest end-to-end slice of a system, deployed through the real pipeline |
