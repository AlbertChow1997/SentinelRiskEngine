# Contracts

API and event contracts are the only thing services share. Code follows the contract, never the other way round
(golden rule 2 in the root `CLAUDE.md`).

| File | Spec | Producer | Consumers | Status |
|---|---|---|---|---|
| `openapi-risk-engine-v1.yaml` | OpenAPI 3.1 (API 1.1.0) | risk-engine | frontend, payment-gateway, llm-insights | Cognito JWT on browser endpoints since RISK-100 (PR #26, ADR-0012); health stays anonymous. Not frozen (H1) |
| `openapi-payment-gateway-v1.yaml` | OpenAPI 3.1 (API 1.0.0) | payment-gateway | merchants, frontend | JWT on ops endpoints and `POST /api/v1/merchants/me` since RISK-100 (PR #26, ADR-0012); payments keep `X-API-Key`. Not frozen (H6) |
| `asyncapi-events-v1.yaml` | AsyncAPI 3.0 (API 1.1.0) | payment-gateway, risk-engine, llm-insights | all services | Adds `risk.insights.v1`; existing topics/messages unchanged. Not frozen |
| `openapi-ml-scorer-v1.yaml` | OpenAPI 3.1 (API 1.0.0) | ml-scorer | risk-engine | Written in RISK-140. Not frozen (freeze point H1, Tue 1 Dec 2026). Internal only, no authentication |
| `openapi-llm-insights-v1.yaml` | OpenAPI 3.1 (API 1.0.0) | llm-insights | frontend | Five JWT-protected advisory and console APIs from RISK-100. Not frozen (H11) |

These are contracts, not running features: no service enforces JWTs yet (RISK-111).
Service-to-service authentication into the Risk Engine (open question Q12) is deferred to RISK-111.

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
