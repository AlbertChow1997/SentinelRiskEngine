# CLAUDE.md — LLM Insights (`llm-insights/`)

Read the root `CLAUDE.md` first; this file only adds what is specific to this folder.
Proposed owner: Zheng Liu (@zliu-59). Design: `docs/DESIGN.md` §4.8, §6.6 and §13. Contract: `contracts/openapi-llm-insights-v1.yaml` (to be written first).

**Change this folder only when the user explicitly asks, and always through a PR that its owner reviews.**

## Hard rules

1. **Advisory only.** Nothing in this service may approve, decline or change a payment or risk decision, and no other service may depend on an insight to decide.
2. **No personal data in prompts.** Build the prompt input from an allow-list of fields. No names, emails or card data. IDs are pseudonymous.
3. **CI never calls a paid API.** Tests use `StubProvider` and a stubbed boto3 client (or moto). `LLM_PROVIDER=stub` is the default everywhere except staging.
4. **Never log prompts or responses.** They are stored in the database only.

## Status

Not scaffolded yet. The commands below are the target once RISK-141 lands; until then `make test-llm` prints "skipped".

## Staging

`llm-insights` runs on staging host C in Zheng's AWS account (ADR-0017, `infra/terraform/envs/staging-ml`). It calls Bedrock with its
ECS task role (no API key; default Claude Haiku 5.5 via the `eu.` inference profile, fallback Nova Lite), reads Kafka on host A
(`10.43.1.10:9092`), its `llm` database on host B (`10.42.1.10:5432`) and the risk engine on host B (`10.42.1.10:8081`).

## Stack

- Python 3.12, managed with **uv**.
- **FastAPI + Pydantic v2**, served by Uvicorn (ADR-0009).
- SQLAlchemy on the `llm` PostgreSQL database; schema changes through **Alembic** migrations.
- **Pydantic v2** validates the LLM's JSON output.
- boto3 Bedrock Runtime, **Converse API**. Check the boto3 documentation for the current request and response shape; do not rely on memory.
- `confluent-kafka` for the consumer and producer.
- pytest, httpx `TestClient`, ruff, mypy.

## Commands

```bash
uv sync
uv run ruff check . && uv run ruff format --check .
uv run mypy .
LLM_PROVIDER=stub uv run pytest
uv run alembic upgrade head
uv run uvicorn llm_insights.api.main:app --reload --port 8001
```

## Conventions

- **One container:** the Kafka consumer starts from the FastAPI lifespan handler and runs beside the API. Keep its loop off the request path; a consumer failure must not take the API down, and the reverse.
- All providers implement `LlmProvider`. Service code never imports boto3 directly.
- Prompts are files: `prompts/<name>/v<N>.md`. **Never edit a prompt in place** — add `v<N+1>`. Every invocation records `promptName` and `promptVersion`.
- Guardrails are not optional: 10 s timeout, 2 retries, token limits, daily cost budget, idempotent on `assessmentId`.
- Invalid model output is stored with status `INVALID_OUTPUT` and never shown to analysts. A provider failure is stored as `ERROR`. Neither may crash the consumer.
- Every invocation is persisted with prompt, raw response, tokens, latency and estimated cost.
- No business logic in route handlers; logic lives in `services/`.
- JWTs are validated against the Cognito JWKS in a FastAPI dependency; roles come from `cognito:groups`. `userId` in feedback is the token's `sub`.
- Never edit an applied Alembic revision; add a new one.
- Type hints everywhere. Settings via `pydantic-settings`.

## Tests

- Unit: prompt rendering (including the allow-list), output parsing and validation, selection and sampling, budget arithmetic, idempotency.
- Integration: consumer with Kafka and PostgreSQL and `StubProvider`; Bedrock adapter against a stubbed client.
- Contract: responses validate against `contracts/openapi-llm-insights-v1.yaml`.
- End-to-end: L1 insight for a REVIEW case · L2 invalid output stored, no crash · L3 provider down, payments unaffected · L4 budget exceeded, calls stop.
- Coverage target: at least 80 % on `services/` and `providers/`.
