# CLAUDE.md — ML Scorer (`ml-scorer/`)

Read the root `CLAUDE.md` first; this file only adds what is specific to this folder.
Owner: Zheng Liu (@zliu-59). Design: `docs/DESIGN.md` §9. Contract: `contracts/openapi-ml-scorer-v1.yaml`.

**This folder belongs to Zheng.** Change it only when the user explicitly asks, and always through a PR that Zheng reviews.

## Status

Not scaffolded yet. The commands below are the target once RISK-50 lands; until then `make test-ml` prints "skipped".

## Staging

`ml-scorer` runs on staging host C in Zheng's AWS account (ADR-0017, `infra/terraform/envs/staging-ml`). The risk engine on host B
calls it at `http://10.44.1.10:8000` over VPC peering; host C takes no internet traffic.

## Stack

- Python 3.12, managed with **uv** (`pyproject.toml` + `uv.lock`).
- **FastAPI + Pydantic v2** (camelCase aliases), served by Uvicorn (ADR-0009). The scorer is stateless: no database.
- pandas, NumPy, scikit-learn (`HistGradientBoostingClassifier`), joblib; `confluent-kafka` for the feedback collector.
- pytest, httpx `TestClient`, ruff (lint + format), mypy.
- **Pin versions in the scaffold PR after checking current documentation**; do not rely on memory for library APIs.

## Commands

```bash
uv sync                                                    # install from uv.lock
uv run ruff check .                                        # lint
uv run ruff format --check .                               # format check (drop --check to format)
uv run mypy .                                              # types
uv run pytest                                              # tests, including the model smoke test
uv run uvicorn ml_scorer.api.main:app --reload --port 8000 # local server
uv run python training/train.py                            # train, evaluate and write models/ and reports/
```

## Conventions

- **One function, two callers:** `build_features()` is used by training and by `/v1/score`. Never compute a feature in two places.
- No business logic in route handlers. Scoring logic lives in plain modules (`features.py`, `explain.py`, `model_store.py`).
- Load the model once at startup (FastAPI lifespan). If loading fails, `/health` reports `modelLoaded: false` and `/v1/score` returns 503.
- Pydantic models in `api/schemas.py` match the contract exactly; JSON is camelCase. Ignore unknown fields in requests and events (`extra="ignore"`).
- `score = round(fraudProbability × 100)`.
- The dataset is reproducible (seed 42) and **synthetic**; say so wherever metrics appear.
- Time-based train/test split. Report PR-AUC as the main metric.
- The feedback collector is a separate process and container. It must never slow down scoring.
- Type hints everywhere. Settings via `pydantic-settings`.
- Log `X-Request-Id`, `transactionId`, score and latency as JSON. Never log full payloads.

## Tests

- `test_features.py`: null-context handling, ratio fallback, night-flag edges.
- `test_api.py`: valid request → 200 and schema-valid; invalid currency → 422; model missing → 503.
- `test_model_smoke.py`: train on 2,000 generated rows and check the pipeline runs end to end.
- Contract check: responses validate against `contracts/openapi-ml-scorer-v1.yaml`.
- Latency: p95 under 50 ms, measured in a test and recorded in the report.
