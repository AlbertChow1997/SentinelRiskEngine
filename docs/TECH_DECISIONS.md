# Sentinel Pay — Technology Decisions

| | |
|---|---|
| **Purpose** | Why each technology was chosen: one comparison table per decision, the chosen option, the ADR that records it and when to look again |
| **Last updated** | 19 Nov 2026 |
| **Update when** | Any new dependency, service, cloud resource or replacement — in the same PR as the change |

**Status values.** *Accepted* — agreed and in force.
*Proposed* — a recommendation that the named owner still has to confirm.

**Criteria.** Every table scores the options on the same five points: **Fit** for this project, **Learning curve** for this team,
**Cost**, **Ecosystem / hiring signal** (how much the choice helps in Irish and EU job interviews), and **Operational burden**.
Costs are indicative for eu-north-1 (re-checked against the AWS Price List API on 23 Nov 2026) and must be re-checked with the AWS Pricing Calculator before the first apply.

## Decision summary

| # | Decision | Chosen | Status | ADR |
|---|---|---|---|---|
| D01 | Backend language and framework | Java 21 + Spring Boot 4 | Accepted | [0008](adr/0008-core-technology-stack.md) |
| D02 | Java build tool | Maven | Accepted | [0008](adr/0008-core-technology-stack.md) |
| D03 | Database | PostgreSQL 18 | Accepted | [0008](adr/0008-core-technology-stack.md) |
| D04 | Messaging | Self-hosted Kafka (single broker, KRaft) | Accepted | 0004, 0006 (to write) |
| D05 | Container platform | ECS on EC2 | Accepted | [0007](adr/0007-single-host-ecs-staging.md) |
| D06 | Infrastructure as code | Terraform | Accepted | [0011](adr/0011-terraform-staging-foundation.md) |
| D07 | Identity provider | Amazon Cognito | Accepted | 0014 (reserved; to write) |
| D08 | LLM access | Amazon Bedrock | Accepted | 0013 (to write) |
| D09 | Frontend UI kit | Tailwind CSS + shadcn/ui (Radix) with own design tokens, Motion, TanStack Table, Recharts | Accepted | [0010](adr/0010-frontend-ui-kit.md) |
| D10 | CI/CD | GitHub Actions | Accepted | [0008](adr/0008-core-technology-stack.md) |
| D11 | Network layout | Public subnets, no NAT Gateway | Accepted | [0007](adr/0007-single-host-ecs-staging.md) |
| D12 | Staging hosting shape | One EC2 host running ECS | Accepted | [0007](adr/0007-single-host-ecs-staging.md) |
| D13 | Database hosting | PostgreSQL container + backups | Accepted | [0007](adr/0007-single-host-ecs-staging.md) |
| D14 | Ingress and TLS | CloudFront with an HTTP origin (prefix list + secret header) | Accepted | [0007](adr/0007-single-host-ecs-staging.md) |
| D15 | Running hours | Scheduled start/stop (EventBridge Scheduler) | Accepted | [0007](adr/0007-single-host-ecs-staging.md) |
| D16 | Python service framework | FastAPI | Accepted | [0009](adr/0009-fastapi-for-python-services.md) |
| D17 | Work tracking | GitHub Issues + GitHub Projects | Accepted | — (process tooling; recorded here) |
| D18 | AWS Region | eu-north-1 (project-locked) | Accepted | [0015](adr/0015-staging-region-eu-north-1.md) |

## ADR index

| ADR | Title | Status | File |
|---|---|---|---|
| 0001 | Record architecture decisions | Accepted | [adr/0001-record-architecture-decisions.md](adr/0001-record-architecture-decisions.md) |
| 0002 | Monorepo | Accepted in design v2.0 | to be written |
| 0003 | ML scorer unavailable: fail open to rules | Accepted in design v2.0 (`DESIGN.md` §4.3) | to be written |
| 0004 | Synchronous REST for decisions, Kafka events for everything else | Accepted in design v2.0 (`DESIGN.md` §4.1) | to be written |
| 0005 | Gateway fallback policy when the Risk Engine is unavailable | Accepted in design v2.0 (`DESIGN.md` §4.7) | to be written |
| 0006 | Transactional outbox | Accepted in design v2.0 (`DESIGN.md` §11.3) | to be written |
| 0007 | Single-host ECS staging with scheduled start/stop | Accepted | [adr/0007-single-host-ecs-staging.md](adr/0007-single-host-ecs-staging.md) |
| 0008 | Core technology stack (D01, D02, D03, D10) | Accepted; updated 16 Nov 2026 | [adr/0008-core-technology-stack.md](adr/0008-core-technology-stack.md) |
| 0009 | FastAPI for the Python services (Django considered and rejected) | Accepted | [adr/0009-fastapi-for-python-services.md](adr/0009-fastapi-for-python-services.md) |
| 0010 | Tailwind CSS and shadcn/ui with our own design tokens for the frontend | Accepted | [adr/0010-frontend-ui-kit.md](adr/0010-frontend-ui-kit.md) |
| [0011](adr/0011-terraform-staging-foundation.md) | Terraform and S3 native state locking | Proposed implementation | RISK-102; not applied |
| [0012](adr/0012-pre-freeze-jwt-contracts.md) | Pre-freeze JWT contract transition | Proposed | RISK-100; producer/consumer review in PR #26 |
| [0015](adr/0015-staging-region-eu-north-1.md) | Run staging in eu-north-1, the AWS project's locked Region | Accepted | RISK-107; amends ADR-0007 |
| 0014 | Amazon Cognito as identity provider | Accepted | Reserved for M3; 0012 is the existing JWT contract ADR |
| 0013 | Amazon Bedrock for LLM access | Accepted | to be written at M4 |

Design v2.0 numbered the tech-stack ADR 0001. ADR-0001 is now "Record architecture decisions" and the stack decision moved to 0008
(open question Q20). ADRs 0002–0006 keep the numbers that `DESIGN.md` already cites.

---

## D01 — Backend language and framework

| Option | Fit | Learning curve | Cost | Ecosystem / hiring signal | Operational burden |
|---|---|---|---|---|---|
| **Java 21 + Spring Boot 4** | Strong: transactions, validation, JPA, Kafka, security and Testcontainers support are first-class | Low — the tech lead already works in Java | Free | Very strong: the default stack of banks and payment companies in Dublin | Moderate memory per service (512 MB budget each) |
| Kotlin + Spring Boot | Same framework, more concise code | Medium — a new language for the team | Free | Good, but fewer openings ask for it | Same as Java |
| Java + Quarkus | Good; fast start-up and low memory, attractive on a 4 GB host | Medium — different extension model and fewer examples | Free | Smaller than Spring | Lower memory, but less team knowledge when things break |

**Chosen:** Java 21 + Spring Boot 4. **Why:** the hiring signal and the team's existing knowledge outweigh Quarkus's memory advantage.
**Baseline:** Spring Boot 4.1.2 and Java 21, selected on 16 Nov 2026 for the M0 scaffold (ADR-0008; Q18 closed).
**Review:** library compatibility when persistence, OpenAPI tooling and security are added.

## D02 — Java build tool

| Option | Fit | Learning curve | Cost | Ecosystem / hiring signal | Operational burden |
|---|---|---|---|---|---|
| **Maven** | Two independent single-module services; convention over configuration is enough | Low | Free | The most common build tool in enterprise Java | Low; `./mvnw -B verify` is the whole CI |
| Gradle | More flexible and faster incremental builds; pays off in large multi-module builds | Medium (Kotlin DSL, build logic) | Free | Common, especially with Kotlin and Android | Build scripts are code that needs maintaining |

**Chosen:** Maven. **Review:** only if build times become a problem.

## D03 — Database

| Option | Fit | Learning curve | Cost | Ecosystem / hiring signal | Operational burden |
|---|---|---|---|---|---|
| **PostgreSQL 18** | Strong: ACID transactions for money, `NUMERIC`, `CHECK` constraints, `JSONB`, `SELECT … FOR UPDATE SKIP LOCKED` for the outbox | Low | Free (container) | Very strong | Self-managed here (D13) |
| MySQL | Would work; weaker JSON and constraint story for this design | Low | Free | Strong | Similar |
| DynamoDB | Poor fit: the ledger, the state machine and the outbox rely on multi-row relational transactions and ad-hoc queries | High — data modelling by access pattern | Pay per request; cheap at demo volume | Strong on AWS | Lowest (managed) |

**Chosen:** PostgreSQL 18, one database per service (`sentinel`, `gateway`, `llm`), explicitly confirmed by the owner on 16 Nov 2026 (ADR-0008). Local, integration-test and staging database versions follow this baseline. The official image volume mounts at `/var/lib/postgresql`. Major upgrades require an explicit decision; Dependabot remains within 18. **Review:** before any major upgrade.

## D04 — Messaging

| Option | Fit | Learning curve | Cost | Ecosystem / hiring signal | Operational burden |
|---|---|---|---|---|---|
| **Self-hosted Kafka (single broker, KRaft)** | Strong: ordered per key, replayable, several consumer groups on one topic, the same in local, CI (Testcontainers) and staging | Medium | No extra cost on the existing host; 768 MB of its memory | Very strong in payments and fintech | We own the broker and its disk; a single broker has no redundancy |
| Amazon MSK | Same API, managed | Medium | Too costly for a demo — the smallest cluster costs several times the whole staging budget | Strong | Low |
| SQS / SNS | Simple and cheap, but no replay, and ordering needs FIFO queues; the outbox and inbox story is less interesting | Low | Near zero at demo volume | Good on AWS | Lowest |
| EventBridge | Good for routing between AWS services; no ordering or replay guarantees suited to a payment lifecycle | Low | Near zero | Good on AWS | Lowest |

**Chosen:** self-hosted Kafka. **Why:** the outbox tables remain the source of truth, so losing the single broker loses no business data.
**Review:** when moving to the production shape (MSK).

## D05 — Container platform

| Option | Fit | Learning curve | Cost | Ecosystem / hiring signal | Operational burden |
|---|---|---|---|---|---|
| **ECS on EC2** | Good: real orchestration (services, task definitions, health checks, rollback) on one small host | Medium | Only the instance (D12) | Strong; task definitions carry over to Fargate | We patch and size one host |
| ECS Fargate | Cleaner — no host — but each task needs its own vCPU/memory and an ALB or Service Connect to be reachable | Medium | Higher: seven or more always-billed tasks plus an ALB | Strong | Low |
| EKS | Overkill for seven containers | High | Control-plane fee alone exceeds the staging budget | Very strong | High |
| Lambda | Poor fit for Kafka consumers, JVM start-up and long-lived connections | Medium | Low at demo volume | Strong | Low, but a different architecture |

**Chosen:** ECS on EC2. **Review:** at the production migration (Fargate).

## D06 — Infrastructure as code

| Option | Fit | Learning curve | Cost | Ecosystem / hiring signal | Operational burden |
|---|---|---|---|---|---|
| **Terraform** | Strong: modules per concern, `plan` in PRs, works beyond AWS | Medium (HCL, state) | Free; S3 state costs cents | Very strong; the most requested IaC skill | Remote state and locking to set up once |
| AWS CDK | Good; real programming languages, but synthesises CloudFormation | Medium | Free | Good on AWS-only teams | CloudFormation stack behaviour (slow rollbacks) |
| CloudFormation | Works; verbose YAML, AWS only | Medium | Free | Moderate | Low tooling, slow feedback |

**Chosen:** Terraform 1.17.2, AWS provider ~> 6.71.0, versioned private S3 state with native `use_lockfile` locking. No DynamoDB table. ADR-0011; code awaits review and approved bootstrap/apply.
**Review:** not planned.

## D07 — Identity provider

| Option | Fit | Learning curve | Cost | Ecosystem / hiring signal | Operational burden |
|---|---|---|---|---|---|
| **Amazon Cognito** | Good: user pool, groups as roles, Hosted UI, standard OIDC and JWKS for Spring Security and Python | Medium (its configuration has quirks) | Free tier covers this project | Good on AWS | None to run; one shared dev/staging pool |
| Auth0 | Best developer experience | Low | Free tier, but a second vendor and account | Strong | None to run |
| Keycloak | Full control, runs locally | Medium–high | Free, but needs ~500 MB+ on a 4 GB host | Strong in enterprise | We would run, upgrade and back it up |

**Chosen:** Amazon Cognito. **Why:** no container on the host and no second vendor. **Trade-off:** local development depends on the shared cloud pool.
**Review:** M3.

## D08 — LLM access

| Option | Fit | Learning curve | Cost | Ecosystem / hiring signal | Operational burden |
|---|---|---|---|---|---|
| **Amazon Bedrock** (Converse API) | Good: IAM-scoped access from the instance role, no API key to store, one API across models, same AWS bill and budget alarm | Low–medium | Pay per token; budget-capped (~$1–3/month at demo volume) | Strong: "LLM on AWS with IAM and guardrails" | Model access must be enabled per account |
| Direct LLM provider API | Simplest SDK, newest models first | Low | Pay per token; a second bill | Strong | An API key to store and rotate; a second vendor |

**Chosen:** Amazon Bedrock behind an `LlmProvider` interface, so a direct-API provider can be added without touching the service logic.
**Open:** the model ID (Q19). **Review:** M4.

## D09 — Frontend UI kit

| Option | Fit | Learning curve | Cost | Ecosystem / hiring signal | Operational burden |
|---|---|---|---|---|---|
| **Tailwind CSS + shadcn/ui (Radix) + Motion** with own design tokens (+ TanStack Table, Recharts) | Strong for a custom marketing site with motion and for a token-driven component library; components are copied into the repo and fully editable; Radix gives accessible primitives | Medium — tables and forms need more assembly | Free | Strong and current; design systems and component libraries are a common frontend interview topic | We own the copied component code |
| MUI + MUI X DataGrid (original choice) | Strong for the data-heavy app area out of the box; harder to make a distinctive marketing site | Low | Free tier of DataGrid is enough | Strong in enterprise dashboards | Low; a look that is recognisably Material |
| Split: Tailwind for the site, MUI for the app | Best fit per area | Medium–high — two systems | Free | Mixed | Two sets of tokens and components for one owner; inconsistent look |

**Chosen:** Tailwind CSS v4 + shadcn/ui on Radix primitives, styled with our own design tokens (CSS variables), Motion (formerly
Framer Motion) for animation, TanStack Table (+ TanStack Virtual) and Recharts in the app area, one kit for the whole frontend.
Storybook is the component catalogue, with axe accessibility checks (ADR-0010, decided by Jiajun on 14 Nov 2026).
**Review:** M3, if the app-area tables take much longer to build than a ready-made data grid would.

## D10 — CI/CD

| Option | Fit | Learning curve | Cost | Ecosystem / hiring signal | Operational burden |
|---|---|---|---|---|---|
| **GitHub Actions** | Strong: next to the code, path-filtered workflows per component, OIDC to AWS, environments with required reviewers, ARM runners | Low | Free for public repositories; a monthly allowance for private ones | Very strong | Low |
| AWS CodePipeline + CodeBuild | Works; pipelines live away from the PR | Medium | Pay per pipeline and build minute | Good on AWS-only teams | More resources to define in Terraform |

**Chosen:** GitHub Actions. **Review:** not planned.

## D11 — Network layout

| Option | Fit | Learning curve | Cost | Ecosystem / hiring signal | Operational burden |
|---|---|---|---|---|---|
| **Public subnet, no NAT Gateway** | Enough for one host: inbound limited by the security group to the CloudFront prefix list, no SSH, SSM Session Manager only | Low | Nothing beyond the Elastic IP (~$3.6/month) | Must be explained as a deliberate cost trade-off | Security group discipline matters |
| Private subnets + NAT Gateway | The textbook layout | Low | A NAT Gateway alone costs more than the whole compute budget (roughly $35/month before data — verify) | Strong | Low |
| Private subnets + VPC endpoints | No NAT, private access to AWS APIs | Medium | Each interface endpoint is billed hourly; several are needed (ECR, SSM, Logs, Bedrock) | Strong | More resources |

**Chosen:** public subnet, no NAT Gateway. **Review:** at the production migration.

## D12 — Staging hosting shape

| Option | Fit | Learning curve | Cost | Ecosystem / hiring signal | Operational burden |
|---|---|---|---|---|---|
| **One EC2 Graviton host running ECS** | Good: every container on one t4g.medium, real ECS deploys, stop/start keeps the data volume | Medium | ≈ $20–28/month on the weekday schedule | Good, and the migration path to Fargate is short | One host to patch; no high availability |
| Fargate + ALB + RDS | The production shape | Medium | Several times higher: ALB (~$18/month) + RDS + per-task compute | Strongest | Lowest |
| App Runner | Simple for stateless HTTP services; no place for Kafka or PostgreSQL | Low | Per-service charges add up across five services | Moderate | Low |
| Lightsail | Cheapest fixed price for a VM | Low | Low | Weak — little of it transfers to production AWS | Manual, not IaC-friendly |
| Non-AWS hosts (Oracle Free Tier, Hetzner) | Cheap or free compute | Low | Lowest | Weak for an AWS-focused portfolio; no Cognito/Bedrock/IAM integration | Manual |

**Chosen:** one EC2 host running ECS (ADR-0007). Indicative monthly cost:

| Item | Monthly |
|---|---|
| t4g.medium, ~14 h × 22 weekdays ≈ 310 h | ~$11–12 |
| EBS gp3 root 30 GB + data 20 GB | ~$4–5 |
| Elastic IP (charged 24/7) | ~$3.6 |
| EBS snapshots, S3 backups, ECR storage | ~$1–2 |
| CloudFront, S3 website, Cognito, CloudWatch (7-day logs) | ~$0–2 (mostly free tier) |
| Bedrock tokens (demo volume, budget-capped) | ~$1–3 |
| **Total** | **≈ $20–28/month**; the same setup running 24/7 ≈ $40–45 |

**Review:** when out-of-memory kills appear (move to t4g.large) and at M5.

## D13 — Database hosting

| Option | Fit | Learning curve | Cost | Ecosystem / hiring signal | Operational burden |
|---|---|---|---|---|---|
| **PostgreSQL 18 container on the data volume** | Enough for demo data; identical to the local stack | Low | No extra cost; 384 MB of host memory | Must be explained as a cost trade-off | We own backups (nightly `pg_dump` to S3, daily EBS snapshots) and upgrades |
| Amazon RDS (single-AZ) | Managed backups, patching and monitoring | Low | A second always-billed resource; cannot be stopped for more than seven days at a time | Strong | Low |

**Chosen:** PostgreSQL container + backups. **Review:** at the production migration (RDS Multi-AZ).

## D14 — Ingress and TLS

| Option | Fit | Learning curve | Cost | Ecosystem / hiring signal | Operational burden |
|---|---|---|---|---|---|
| **CloudFront → HTTP origin, locked to the CloudFront prefix list + a secret header checked by nginx** | Gives HTTPS to the browser on the default `*.cloudfront.net` domain with no domain or certificate to buy | Medium | Mostly free tier | The trade-off (unencrypted hop inside AWS) must be explained | Rotate the secret header (stored in SSM) |
| ALB + ACM | Managed TLS termination and health checks | Low | ~$18/month for the ALB; still needs a domain for a public certificate | Strong | Low |
| Own domain + TLS to the origin | End-to-end encryption | Medium | Domain registration; certificate renewal on the host | Strong | Certificates on the instance |

**Implementation note (20 Nov 2026, RISK-104):** default CloudFront certificates force TLSv1 policy; strict TLS needs a domain/ACM. WAF is deferred, not silently provisioned outside the budget. SSE-S3/no-WAF exceptions are scoped and expire 31 Jan 2027. The static-only SPA rewrite adds a CloudFront Function (request-based cost; confirm current free allowance/pricing before apply).

**Chosen:** CloudFront with an HTTP origin. **Upgrade path:** own domain + TLS to the origin. **Review:** M5 (threat model).

## D15 — Running hours

| Option | Fit | Learning curve | Cost | Ecosystem / hiring signal | Operational burden |
|---|---|---|---|---|---|
| **Scheduled start/stop** (EventBridge Scheduler, Mon–Fri 09:00–23:00 Europe/Dublin) | Good: a demo environment is only needed when someone looks at it; the website and `/sample` stay up | Low | Roughly halves compute cost (≈ $20–28 vs ≈ $40–45 a month) | Shows cost awareness | Boot must be reliable (≤ 5 min); alarms must tolerate downtime; `make aws-wake` before demos |
| Always on | Simplest | None | ≈ $40–45/month | Neutral | None |
| Spot instance | Cheapest per hour | Medium | Lowest | Good story | Interruptions with stateful Kafka and PostgreSQL on the host are painful |

**Chosen:** scheduled start/stop. *Development window (23 Nov 2026):* every day 19:00–02:00 Europe/Dublin (~210 h/month); the Mon–Fri 09:00–23:00 demo window returns before release (RISK-117). **Review:** M5.

## D16 — Python service framework

| Option | Fit | Learning curve | Cost | Ecosystem / hiring signal | Operational burden |
|---|---|---|---|---|---|
| **FastAPI** | Strong for a small, typed, stateless scoring API; Pydantic-native, which matches the contract-first approach and the LLM output validation. `llm-insights` adds SQLAlchemy + Alembic and a small JWT dependency | Low | Free | Strong and growing, especially in ML and AI services | Lowest memory; the Kafka consumer can share the service's container |
| Django + Django REST Framework | Strong for `llm-insights` alone (ORM, migrations, permissions, pagination built in); heavier than the stateless `ml-scorer` needs | Low–medium | Free | Strong: long-established in Python backend roles | More memory per service; the Kafka consumer needs its own process and container on a 4 GB host |
| Flask | Minimal; everything else is assembled by hand | Low | Free | Moderate | More glue code to own |

**Chosen:** FastAPI for `ml-scorer` and `llm-insights` (ADR-0009). Django was evaluated on 11 Nov 2026 and rejected: its
built-in pieces help only one of the two services, and it costs memory and an extra container on the single staging host.
**Review:** at M4, if the `llm-insights` console APIs turn out to need much hand-written paging, filtering and permission code.

## D17 — Work tracking

| Option | Fit | Learning curve | Cost | Ecosystem / hiring signal | Operational burden |
|---|---|---|---|---|---|
| **GitHub Issues + GitHub Projects** | Enough for three people: board, one-week iterations, estimates, milestones; issues, PRs and code in one place | Low | Free | The workflow (tickets, sprints, linked PRs) is what transfers; the tool is common in newer companies | One system; `Closes #n` keeps the board current |
| Jira (design v2.0) | Full-featured: epics, versions, reports | Medium | Free up to 10 users | Strong in banks and large payment companies | Two systems to keep in sync with GitHub; a second account for everyone |
| Linear | Fast and pleasant | Low | Free tier | Common in start-ups | Two systems to keep in sync |

**Chosen:** GitHub Issues + GitHub Projects (decided 11 Nov 2026). **Why:** for a three-person team, keeping Jira and GitHub linked
both ways is overhead with no benefit. The `RISK-<n>` keys stay as backlog IDs in issue titles, branches and commits.
**Review:** not planned.

## D18 — AWS Region

| Option | Fit | Learning curve | Cost | Ecosystem / hiring signal | Operational burden |
|---|---|---|---|---|---|
| **eu-north-1 (Stockholm)** | The only Region the team's AWS project can use | None | Slightly lower: `t4g.medium` USD 0.0344/h, gp3 USD 0.0836/GB-month | Neutral | Bedrock Claude only via cross-Region inference profiles, which the Free plan may block (RISK-108) |
| eu-west-1 (Ireland, original plan) | Closest to the team | None | `t4g.medium` USD 0.0368/h, gp3 USD 0.0880/GB-month | Neutral | Needs a second, advanced AWS account; gives up the project's credit |

**Chosen:** eu-north-1 (decided 23 Nov 2026, ADR-0015). **Review:** if the team moves to an advanced AWS account.
