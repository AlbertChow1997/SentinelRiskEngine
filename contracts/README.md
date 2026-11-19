# Contracts

API and event contracts are the only thing services share. Code follows the contract, never the other way round
(golden rule 2 in the root `CLAUDE.md`).

| File | Spec | Producer | Consumers | Status |
|---|---|---|---|---|
| `openapi-risk-engine-v1.yaml` | OpenAPI 3.1 (API 1.1.0) | risk-engine | frontend, payment-gateway, llm-insights | Imported from design v2.0. Not frozen. JWT security pending |
| `openapi-payment-gateway-v1.yaml` | OpenAPI 3.1 (API 1.0.0) | payment-gateway | merchants, frontend | Imported from design v2.0. Not frozen. JWT on ops endpoints and `POST /api/v1/merchants/me` pending |
| `asyncapi-events-v1.yaml` | AsyncAPI 3.0 | payment-gateway, risk-engine | all services | Imported from design v2.0. Not frozen. `risk.insights.v1` pending |
| `openapi-ml-scorer-v1.yaml` | OpenAPI 3.1 (API 1.0.0) | ml-scorer | risk-engine | Written in RISK-140. Not frozen (freeze point H1, Tue 1 Dec 2026). Internal only, no authentication |
| `openapi-llm-insights-v1.yaml` | OpenAPI 3.1 | llm-insights | frontend | **Missing** — bootstrap item 4 |

The three imported files are byte-for-byte copies of the design v2.0 contracts, so the next contract PR shows
the security and LLM additions as a clean diff.

## Change process

1. Open a PR that changes only files in `contracts/`.
2. The producer **and** every consumer listed in `.github/CODEOWNERS` approve.
3. Additive changes (new optional field, new endpoint, new event type) are allowed at any time.
4. Breaking changes are not allowed once a contract is frozen. They need a new version (`/api/v2`, topic `.v2`) and an ADR.
5. Event consumers must ignore unknown fields.

## Validate locally

```bash
make contracts
```

This runs Redocly lint on the OpenAPI files (`contracts/redocly.yaml`), the AsyncAPI CLI validator on the event
file, and an `oasdiff` breaking-change check against `origin/main`. The same checks run in
`.github/workflows/contracts.yml`.

Without GNU Make:

```bash
npx @redocly/cli@2 lint --config contracts/redocly.yaml contracts/openapi-*.yaml
npx @asyncapi/cli@6 validate contracts/asyncapi-events-v1.yaml
```
