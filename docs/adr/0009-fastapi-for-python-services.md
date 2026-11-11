# ADR-0009: Use FastAPI for the Python services

| | |
|---|---|
| **Status** | Accepted |
| **Date** | 11 Nov 2026 |
| **Deciders** | Jiawei Zhou (tech lead); Zheng Liu (owner of `ml-scorer/`, proposed owner of `llm-insights/`) informed |
| **Related** | `DESIGN.md` §9, §13 · `TECH_DECISIONS.md` D16 |

## Context

Two components are written in Python:

- **`ml-scorer`** — a stateless scoring API (`/v1/score`, `/v1/model-info`, `/health`) around a scikit-learn model, plus a Kafka feedback collector that runs as a separate process.
- **`llm-insights`** — a Kafka consumer that calls an LLM, stores every invocation in its own PostgreSQL database, and serves read APIs with role-based access, paging and filtering for the review flow and the LLM Console.

Design v2.0 chose FastAPI for `ml-scorer`. When `llm-insights` was added, the question was whether to keep FastAPI for both
services or move the Python side to Django, whose built-in ORM, migrations, permissions and pagination suit `llm-insights`.
Django was briefly adopted on 11 Nov 2026 and reversed the same day, before any Python code existed.

All backend containers share one 4 GB staging host (ADR-0007), so memory per service and the number of containers matter.

## Options

1. **FastAPI for both services** — small, typed and Pydantic-native. A natural fit for `ml-scorer`. `llm-insights` adds SQLAlchemy, Alembic and a small JWT dependency, and writes its own paging and filtering.
2. **Django + Django REST Framework for both** — ORM, migrations, permission classes, pagination and filtering come built in, which helps `llm-insights`. Heavier than the stateless `ml-scorer` needs; the Kafka consumer must run as a separate process and container; validation errors default to 400 where the ML design documents 422.
3. **Mixed** — FastAPI for `ml-scorer`, Django for `llm-insights`. The best fit per service, but two frameworks for one owner to learn, configure, test and secure.
4. **Flask** — minimal; every other piece is assembled by hand.

## Decision

Both Python services use **FastAPI** with **Pydantic v2**, served by Uvicorn.

- `ml-scorer` keeps the design of `DESIGN.md` §9 unchanged.
- `llm-insights` uses SQLAlchemy on its own `llm` database with **Alembic** migrations, validates Cognito JWTs in a FastAPI dependency, and runs its Kafka consumer inside the service container, started from the lifespan handler.

Reasons:

- **Fit with contract-first, typed development.** Request, response and LLM-output schemas are all Pydantic models that mirror `contracts/`, so there is one way to describe a schema.
- **Footprint.** Lower memory per service, and `llm-insights` stays in a single container within the staging memory budget.
- **No rework.** The ML design, its test plan and its documented behaviour (422 on validation errors, model loading in the lifespan handler) stay as written.
- **One framework for both Python services**, owned by one person.

## Consequences

- `llm-insights` has to build what Django would have provided: paging and filtering for the invocation list, role checks, and migration discipline with Alembic. This is accepted; the API surface is five endpoints.
- There is no admin site. The LLM Console in the frontend is the inspection tool.
- The consumer shares a container with the API. If it ever needs to scale or restart independently, it moves to its own process from the same image.
- The Kafka client library, the SQLAlchemy style (sync or async) and exact versions are pinned in the scaffold PRs (RISK-50, RISK-141) after checking current documentation.

**Revisit when** the `llm-insights` console APIs need substantially more hand-written paging, filtering and permission code than expected (review at M4).
