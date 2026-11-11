# CLAUDE.md — LLM Insights (`llm-insights/`)

Read the root `CLAUDE.md` first; this file only adds what is specific to this folder.
Proposed owner: Zheng Liu. Design: `docs/DESIGN.md` §4.8, §6.6 and §13. Contract: `contracts/openapi-llm-insights-v1.yaml` (to be written first).

**Change this folder only when the user explicitly asks, and always through a PR that its owner reviews.**

## Hard rules

1. **Advisory only.** Nothing in this service may approve, decline or change a payment or risk decision, and no other service may depend on an insight to decide.
2. **No personal data in prompts.** Build the prompt input from an allow-list of fields. No names, emails or card data. IDs are pseudonymous.
3. **CI never calls a paid API.** Tests use `StubProvider` and a stubbed boto3 client (or moto). `LLM_PROVIDER=stub` is the default everywhere except staging.
4. **Never log prompts or responses.** They are stored in the database only.

## Status

Not scaffolded yet. The commands below are the target once RISK-141 lands; until then `make test-llm` prints "skipped".

## Stack

- Python 3.12, managed with **uv**.
- **Django + Django REST Framework** (ADR-0009), Gunicorn. Django ORM on the `llm` PostgreSQL database; schema changes through **Django migrations**.
- **Pydantic v2** validates the LLM's JSON output.
- boto3 Bedrock Runtime, **Converse API**. Check the boto3 documentation for the current request and response shape; do not rely on memory.
- `confluent-kafka` for the consumer and producer.
- pytest + pytest-django, ruff, mypy.

## Commands

```bash
uv sync
uv run ruff check . && uv run ruff format --check .
uv run mypy .
LLM_PROVIDER=stub uv run pytest
uv run python manage.py migrate
uv run python manage.py runserver 8001             # web process
uv run python manage.py consume_assessments        # Kafka consumer process
```

## Conventions

- **Two processes, one image:** the web process and the `consume_assessments` management command. Never run the Kafka loop inside a request worker.
- All providers implement `LlmProvider`. Service code never imports boto3 directly.
- Prompts are files: `prompts/<name>/v<N>.md`. **Never edit a prompt in place** — add `v<N+1>`. Every invocation records `promptName` and `promptVersion`.
- Guardrails are not optional: 10 s timeout, 2 retries, token limits, daily cost budget, idempotent on `assessmentId`.
- Invalid model output is stored with status `INVALID_OUTPUT` and never shown to analysts. A provider failure is stored as `ERROR`. Neither may crash the consumer.
- Every invocation is persisted with prompt, raw response, tokens, latency and estimated cost.
- Views and serializers stay thin; logic lives in `services/`.
- JWTs are validated against the Cognito JWKS; roles come from `cognito:groups`. `userId` in feedback is the token's `sub`.
- Never edit an applied migration; add a new one.
- Type hints everywhere. Settings come from environment variables, validated at startup.

## Tests

- Unit: prompt rendering (including the allow-list), output parsing and validation, selection and sampling, budget arithmetic, idempotency.
- Integration: consumer with Kafka and PostgreSQL and `StubProvider`; Bedrock adapter against a stubbed client.
- Contract: responses validate against `contracts/openapi-llm-insights-v1.yaml`.
- End-to-end: L1 insight for a REVIEW case · L2 invalid output stored, no crash · L3 provider down, payments unaffected · L4 budget exceeded, calls stop.
- Coverage target: at least 80 % on `services/` and `providers/`.
