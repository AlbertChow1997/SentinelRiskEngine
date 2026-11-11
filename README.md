# Sentinel Pay

> **Portfolio project — not a real payment service.** Cards are test tokens, the acquirer is simulated, the fraud model is
> trained on synthetic data, and pricing is demo pricing. No card numbers are ever accepted or stored.

Sentinel Pay simulates an enterprise fintech product: a **payment gateway** that screens every payment in real time with a
**risk engine** (deterministic rules + a machine-learning score), routes doubtful payments to human analysts, and adds an
**AI-generated, advisory** case summary for each review. It comes with a public website and web app, and it is built and run
the way a large engineering organisation would: design docs, architecture decision records, small reviewed pull requests,
CI/CD, infrastructure as code and operational readiness reviews.

**Status:** repository bootstrap. Documents, contracts and tooling are in place; the services are not scaffolded yet.
See [`docs/ROADMAP.md`](docs/ROADMAP.md).

## Architecture

<!-- TODO: replace with a rendered diagram (docs/images/architecture.png) once the walking skeleton is deployed. -->

```text
Merchant/App ──▶ payment-gateway ──sync REST──▶ risk-engine ──REST──▶ ml-scorer
                     │  (decision returned while the merchant waits)
                     │
                     ▼ outbox → Kafka
     payments.events.v1          risk.assessments.v1 ──▶ llm-insights  (async, advisory only)
                                                            │ prompt → LLM → validated JSON
                                                            └─▶ risk.insights.v1

Browser ──▶ frontend (website + web app) ── login ──▶ Amazon Cognito
```

- **Synchronous where a decision is needed, asynchronous everywhere else.** The risk check happens while the merchant waits; outcomes, held-payment resumption, fraud feedback and AI summaries travel as Kafka events.
- **No lost or duplicated business effects.** Events are written through a transactional outbox and consumed idempotently.
- **Graceful degradation.** ML down → rules only. Risk engine down → a fallback policy by amount. Kafka down → events queue in the outbox. LLM down → nothing changes for payments.
- **The LLM never decides.** It writes a summary for a human analyst and nothing else.

The full design is in [`docs/DESIGN.md`](docs/DESIGN.md).

## Repository layout

| Path | What | Stack | Owner |
|---|---|---|---|
| [`backend/`](backend/) | Risk Engine | Java 21, Spring Boot 4, Maven | Jiawei Zhou |
| [`payment-gateway/`](payment-gateway/) | Payment Gateway | Java 21, Spring Boot 4, Spring Kafka | Jiawei Zhou |
| [`ml-scorer/`](ml-scorer/) | ML scoring service | Python 3.12, Django, scikit-learn, uv | Zheng Liu |
| [`llm-insights/`](llm-insights/) | LLM insight service | Python 3.12, Django, Amazon Bedrock | Zheng Liu (proposed) |
| [`frontend/`](frontend/) | Website + web app | React 19, TypeScript, Vite | Jiajun Xiao |
| [`contracts/`](contracts/) | OpenAPI 3.1 and AsyncAPI 3.0 contracts | — | shared |
| [`infra/`](infra/) | Terraform for AWS staging, operations scripts | Terraform | Jiawei Zhou |
| [`e2e/`](e2e/) | Newman API scenarios, sample events | — | shared |
| [`docs/`](docs/) | Design, roadmap, decisions, ADRs, runbooks, threat model | — | shared |

## Quick start

Prerequisites: Docker with Compose, GNU Make and a POSIX shell (Linux, macOS, WSL or Git Bash). Node.js is needed for the
contract checks.

```bash
cp .env.example .env     # local-only settings; .env is git-ignored
make up                  # start PostgreSQL and Kafka
make contracts           # validate the OpenAPI and AsyncAPI contracts
make test                # run every component's tests (components not scaffolded yet are skipped)
make down
```

`make help` lists every target. Without Make, the equivalent commands are `docker compose up -d` and those shown in
[`contracts/README.md`](contracts/README.md).

Local ports: gateway 8080 · risk-engine 8081 · ml-scorer 8000 · llm-insights 8001 · frontend 5173 (dev) / 3000 (Docker) ·
PostgreSQL 5432 · Kafka 9092 · Kafka UI 8085.

## Documentation

| Document | Purpose |
|---|---|
| [`docs/DESIGN.md`](docs/DESIGN.md) | How the system works: architecture, workflows, data models, contracts, auth, AWS |
| [`docs/ROADMAP.md`](docs/ROADMAP.md) | When and who: milestones, sprint plan, backlog, hand-offs, progress log |
| [`docs/TECH_DECISIONS.md`](docs/TECH_DECISIONS.md) | Why this technology: comparison tables and the ADR index |
| [`docs/adr/`](docs/adr/) | One file per architecture decision |
| [`docs/runbooks/`](docs/runbooks/) | How to operate each service; the Operational Readiness Review checklist |
| [`docs/threat-model.md`](docs/threat-model.md) | STRIDE threat model |
| [`CLAUDE.md`](CLAUDE.md) | Working agreement for AI-assisted development in this repository |

## How we work

- **Contracts first.** `contracts/` changes before the code that depends on it.
- **One Jira ticket → one branch → one pull request**, ideally under 400 changed lines, with tests.
- Branches: `feature/RISK-<n>-short-name`, `fix/RISK-<n>-…`, `chore/…`, `docs/…`. Commits: Conventional Commits with the Jira key, for example `feat(gateway): RISK-73 add idempotency key replay`.
- Every pull request needs one approval from another team member and green checks; `main` is squash-merged and always releasable.
- Decisions are recorded as ADRs. Questions and blockers become GitHub issues instead of guesses.
- No secrets, personal data or card numbers in the repository, in logs or in LLM prompts.

## Team

| Person | Role |
|---|---|
| Jiawei Zhou ([@AlbertChow1997](https://github.com/AlbertChow1997)) | Tech lead · Risk Engine · Payment Gateway · infrastructure · CI/CD · releases |
| Jiajun Xiao | Frontend: website and web app |
| Zheng Liu | ML scoring · LLM insights (proposed) |

## Licence

Not chosen yet. Until a licence file is added, all rights are reserved by the authors.
