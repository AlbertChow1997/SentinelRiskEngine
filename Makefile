# Sentinel Pay — one entry point for common commands (CLAUDE.md §11).
#
# Requires GNU Make and a POSIX shell (Linux, macOS, WSL or Git Bash).
# Targets for components that are not scaffolded yet print "skipped" instead of failing,
# so `make test` and `make lint` stay usable while the monorepo fills in.

SHELL := /bin/bash
.DEFAULT_GOAL := help

COMPOSE        ?= docker compose
REDOCLY        ?= npx --yes @redocly/cli@2
ASYNCAPI       ?= npx --yes @asyncapi/cli@6
OASDIFF        ?= docker run --rm -v "$(CURDIR)":/work -w /work tufin/oasdiff
BASE_REF       ?= origin/main
OPENAPI_FILES  := $(wildcard contracts/openapi-*.yaml)
ASYNCAPI_FILES := $(wildcard contracts/asyncapi-*.yaml)
TF_STAGING     := infra/terraform/envs/staging

.PHONY: help up down test test-backend test-gateway test-ml test-llm test-frontend \
        lint contracts e2e tf-plan aws-wake aws-sleep aws-status

help: ## Show this help
	@grep -hE '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-16s\033[0m %s\n", $$1, $$2}'

# ---------------------------------------------------------------- local stack

.env:
	cp .env.example .env

up: .env ## Start the local stack (docker compose; LLM uses StubProvider)
	$(COMPOSE) up -d

down: ## Stop the local stack
	$(COMPOSE) down

# ---------------------------------------------------------------------- tests

test: test-backend test-gateway test-ml test-llm test-frontend ## Run all component test suites

test-backend: ## Risk Engine: ./mvnw -B verify
	@if [ -f backend/mvnw ]; then cd backend && ./mvnw -B verify; else echo "backend: not scaffolded yet - skipped"; fi

test-gateway: ## Payment Gateway: ./mvnw -B verify
	@if [ -f payment-gateway/mvnw ]; then cd payment-gateway && ./mvnw -B verify; else echo "payment-gateway: not scaffolded yet - skipped"; fi

test-ml: ## ML scorer: uv run pytest
	@if [ -f ml-scorer/pyproject.toml ]; then cd ml-scorer && uv sync && uv run pytest; else echo "ml-scorer: not scaffolded yet - skipped"; fi

test-llm: ## LLM insights: uv run pytest (StubProvider only)
	@if [ -f llm-insights/pyproject.toml ]; then cd llm-insights && uv sync && LLM_PROVIDER=stub uv run pytest; else echo "llm-insights: not scaffolded yet - skipped"; fi

test-frontend: ## Frontend: unit tests
	@if [ -f frontend/package.json ]; then cd frontend && npm ci && npm test -- --run; else echo "frontend: not scaffolded yet - skipped"; fi

# ----------------------------------------------------------------------- lint

lint: ## All linters/formatters in check mode
	@if [ -f backend/mvnw ]; then (cd backend && ./mvnw -B spotless:check); else echo "backend: not scaffolded yet - skipped"; fi
	@if [ -f payment-gateway/mvnw ]; then (cd payment-gateway && ./mvnw -B spotless:check); else echo "payment-gateway: not scaffolded yet - skipped"; fi
	@for c in ml-scorer llm-insights; do \
	  if [ -f $$c/pyproject.toml ]; then (cd $$c && uv run ruff check . && uv run ruff format --check . && uv run mypy .) || exit 1; \
	  else echo "$$c: not scaffolded yet - skipped"; fi; \
	done
	@if [ -f frontend/package.json ]; then (cd frontend && npm run lint && npm run typecheck); else echo "frontend: not scaffolded yet - skipped"; fi
	@if command -v terraform >/dev/null 2>&1 && ls infra/terraform/**/*.tf >/dev/null 2>&1; then terraform -chdir=infra/terraform fmt -check -recursive; else echo "terraform: nothing to check - skipped"; fi

# ------------------------------------------------------------------ contracts

contracts: ## Validate OpenAPI/AsyncAPI and check for breaking changes against BASE_REF
	$(REDOCLY) lint --config contracts/redocly.yaml $(OPENAPI_FILES)
	@for f in $(ASYNCAPI_FILES); do $(ASYNCAPI) validate $$f || exit 1; done
	@BASE_REF=$(BASE_REF) bash contracts/check-breaking.sh

# ------------------------------------------------------------------------ e2e

e2e: ## Newman API scenarios + Playwright UI smoke against the local stack
	@if ls e2e/*.postman_collection.json >/dev/null 2>&1; then \
	  for c in e2e/*.postman_collection.json; do npx --yes newman run $$c || exit 1; done; \
	else echo "e2e: no Newman collection yet - skipped"; fi
	@if [ -f frontend/playwright.config.ts ]; then cd frontend && npx playwright test; else echo "e2e: no Playwright config yet - skipped"; fi

# ------------------------------------------------------------------------ AWS
# `tf-plan` and `aws-status` are read-only. `aws-wake` / `aws-sleep` change AWS state
# and cost money: the scripts must ask for confirmation before acting.

tf-plan: ## terraform plan for staging (read-only)
	@if ls $(TF_STAGING)/*.tf >/dev/null 2>&1; then terraform -chdir=$(TF_STAGING) plan; else echo "infra: staging environment not written yet - skipped"; fi

aws-wake: ## Start the EC2 host and wait for ECS services (asks for confirmation)
	@if [ -x infra/scripts/aws-wake.sh ]; then infra/scripts/aws-wake.sh; else echo "infra/scripts/aws-wake.sh not written yet"; exit 1; fi

aws-sleep: ## Stop the EC2 host (asks for confirmation)
	@if [ -x infra/scripts/aws-sleep.sh ]; then infra/scripts/aws-sleep.sh; else echo "infra/scripts/aws-sleep.sh not written yet"; exit 1; fi

aws-status: ## Instance state, ECS service health, next scheduled start/stop
	@if [ -x infra/scripts/aws-status.sh ]; then infra/scripts/aws-status.sh; else echo "infra/scripts/aws-status.sh not written yet"; exit 1; fi
