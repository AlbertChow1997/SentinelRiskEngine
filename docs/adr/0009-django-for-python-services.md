# ADR-0009: Use Django for the Python services

| | |
|---|---|
| **Status** | Accepted by the tech lead on 11 Nov 2026 · review by the owner of `ml-scorer/` (Zheng Liu) pending |
| **Date** | 11 Nov 2026 |
| **Deciders** | Jiawei Zhou (tech lead); Zheng Liu (owner of `ml-scorer/`, proposed owner of `llm-insights/`) to review |
| **Related** | `DESIGN.md` §9, §13 · `TECH_DECISIONS.md` D16 · open question Q11 |
| **Supersedes** | The FastAPI choice in design v2.0 §9.1 and in the first version of the project brief |

## Context

Two components are written in Python:

- **`ml-scorer`** — a stateless scoring API (`/v1/score`, `/v1/model-info`, `/health`) around a scikit-learn model, plus a Kafka feedback collector that runs as a separate process.
- **`llm-insights`** — a Kafka consumer that calls an LLM, stores every invocation in its own PostgreSQL database, and serves read APIs with role-based access, paging and filtering for the review flow and the LLM Console.

Design v2.0 chose FastAPI for `ml-scorer`, and the first project brief extended that choice to `llm-insights` with
SQLAlchemy and Alembic for persistence. No Python code has been written yet, so changing the framework costs only documentation.

On 11 Nov 2026 the tech lead set the stack direction for the project: React for the frontend, Java + Spring Boot for the core
backends, and **Python + Django for the ML and LLM parts and their backends**.

## Options

1. **FastAPI** (previous choice) — small, typed, Pydantic-native and light on memory. A natural fit for `ml-scorer`. For `llm-insights` it needs SQLAlchemy, Alembic, and hand-built authentication, permissions, paging and filtering.
2. **Django + Django REST Framework (DRF)** — a full framework: ORM, migrations, authentication and permission classes, pagination, filtering and an admin site. A natural fit for `llm-insights`. Heavier than `ml-scorer` needs.
3. **Django + Django Ninja** — Django's ORM and migrations with a FastAPI-like, Pydantic-native API layer. Closest to the original design, but a smaller community than DRF.
4. **Flask** — minimal; every other piece is assembled by hand.
5. **Mixed** — FastAPI for `ml-scorer`, Django for `llm-insights`. The best fit for each service, but two frameworks for one owner to learn, configure, test and keep secure.

## Decision

Both Python services use **Django**. The API layer is **Django REST Framework** (proposed; see the open points below).

Reasons:

- **One framework for both Python services**, owned by one person: one set of conventions, one testing approach (`pytest-django`), one authentication implementation.
- **`llm-insights` gets most of its plumbing for free**: models and migrations for `llm_invocation` and `insight_feedback`, permission classes for the `analyst` / `developer` / `admin` roles, pagination and filtering for the invocation list.
- **Hiring signal.** Django is long-established and widely requested for Python backend roles; together with Spring Boot and React it gives the project three mainstream stacks.

What stays the same: Python 3.12, `uv`, `ruff`, `mypy`, **Pydantic v2 for validating the LLM's JSON output** and for settings,
scikit-learn, `confluent-kafka`, boto3, and the rule that contracts in `contracts/` come first.

## Consequences

**Changes to the design**

| Area | With FastAPI (before) | With Django (now) |
|---|---|---|
| Persistence in `llm-insights` | SQLAlchemy + Alembic | Django ORM + Django migrations |
| Model loading in `ml-scorer` | FastAPI lifespan | `AppConfig.ready()` per worker, or Gunicorn `--preload` |
| Server | Uvicorn (ASGI) | Gunicorn (WSGI) |
| Request/response schemas | Pydantic models | DRF serializers (Pydantic remains for LLM output and settings) |
| Tests | httpx `TestClient` | `pytest-django` + DRF `APIClient` |
| "No business logic in route handlers" | Routes call service functions | Views and serializers stay thin; logic lives in `services/` modules |
| Kafka consumer in `llm-insights` | Could share the web process's event loop | **Separate process**: a management command in its own container |

**Costs we accept**

- **`ml-scorer` carries more framework than it needs.** It has no database, so it runs with `DATABASES = {}` and only the Django apps it uses. The latency target (p95 < 50 ms) must be re-measured on Django.
- **More memory per Python service** than FastAPI, and **one more container** for the `llm-insights` consumer. The 4 GB staging budget (`DESIGN.md` §19.2) has to be re-checked at M4 (Q13).
- **Validation errors are 400 by default in DRF**, where FastAPI returns 422. Design v2.0 documented 422 for the ML API. The Risk Engine treats any non-2xx as "ML unavailable", so behaviour does not change, but the ML contract must state one of the two.
- **Two ways to describe a schema** (DRF serializers for requests and responses, Pydantic for LLM output). Contract tests against `contracts/` keep them honest.

**Open points for the owner's review (Q11)**

1. **API layer:** DRF (proposed, mainstream) or Django Ninja (Pydantic-native, closer to the original design).
2. **Django release line:** the current release or the LTS line. Check the supported versions on the Django download page and DRF's compatibility notes before pinning; do not rely on memory.
3. **Validation status code** for the ML API: keep 422 (custom exception handler) or adopt 400.
4. **Settings:** `pydantic-settings` inside `settings.py` (proposed, keeps one validation library) or `django-environ`.
5. **Async:** WSGI + Gunicorn is proposed. Revisit only if a measured need appears.

**Follow-up**

- `DESIGN.md` §4.2, §6.3, §9 and §13, `CLAUDE.md`, and the component guides in `ml-scorer/` and `llm-insights/` are updated in the same PR as this ADR.
- RISK-50 becomes "Django + DRF scaffold". Its PR pins the versions and settles open points 1–4.
