# CLAUDE.md — ML Scorer (`ml-scorer/`)

Read the root `CLAUDE.md` first; this file only adds what is specific to this folder.
Owner: Zheng Liu. Design: `docs/DESIGN.md` §9. Contract: `contracts/openapi-ml-scorer-v1.yaml` (to be written first — Q16).

**This folder belongs to Zheng.** Change it only when the user explicitly asks, and always through a PR that Zheng reviews.

## Status

Not scaffolded yet. The commands below are the target once RISK-50 lands; until then `make test-ml` prints "skipped".

## Stack

- Python 3.12, managed with **uv** (`pyproject.toml` + `uv.lock`).
- **Django + Django REST Framework** (ADR-0009), served by Gunicorn. The scorer is stateless: no database (`DATABASES = {}`), no ORM models, no migrations.
- pandas, NumPy, scikit-learn (`HistGradientBoostingClassifier`), joblib; `confluent-kafka` for the feedback collector.
- pytest + pytest-django, DRF `APIClient`, ruff (lint + format), mypy.
- **Pin versions in the scaffold PR after checking the Django and DRF release notes.** Open points are listed in ADR-0009 (API layer, Django release line, validation status code).

## Commands

```bash
uv sync                                  # install from uv.lock
uv run ruff check .                      # lint
uv run ruff format --check .             # format check (drop --check to format)
uv run mypy .                            # types
uv run pytest                            # tests, including the model smoke test
uv run python manage.py runserver 8000   # local server
uv run python training/train.py          # train, evaluate and write models/ and reports/
```

## Conventions

- **One function, two callers:** `build_features()` is used by training and by `/v1/score`. Never compute a feature in two places.
- Views and serializers stay thin. Scoring logic lives in plain modules (`features.py`, `explain.py`, `model_store.py`).
- Load the model once per worker process at startup. If loading fails, `/health` reports `modelLoaded: false` and `/v1/score` returns 503.
- JSON is camelCase and matches the contract exactly. Ignore unknown fields in requests and events.
- `score = round(fraudProbability × 100)`.
- The dataset is reproducible (seed 42) and **synthetic**; say so wherever metrics appear.
- Time-based train/test split. Report PR-AUC as the main metric.
- The feedback collector is a separate process and container. It must never slow down scoring.
- Type hints everywhere. Settings come from environment variables, validated at startup.
- Log `X-Request-Id`, `transactionId`, score and latency as JSON. Never log full payloads.

## Tests

- `test_features.py`: null-context handling, ratio fallback, night-flag edges.
- `test_api.py`: valid request → 200 and schema-valid; invalid input → validation error; model missing → 503.
- `test_model_smoke.py`: train on 2,000 generated rows and check the pipeline runs end to end.
- Contract check: responses validate against `contracts/openapi-ml-scorer-v1.yaml`.
- Latency: p95 under 50 ms, measured in a test and recorded in the report.
