# Contracts

RISK-100 now drafts all five LLM operations, the insights event, Gateway/Risk
Cognito bearer authentication and `POST /api/v1/merchants/me` in PR #26.
These are contracts awaiting producer/consumer approval, not runtime features.
Q12 service authentication is explicitly deferred to RISK-111. ADR-0012 records
the intentional pre-freeze removal of anonymous access; `check-breaking.sh`
allows only its exact findings against byte-specific imported baselines.

API and event contracts are the only thing services share. Code follows the contract, never the other way round
(golden rule 2 in the root `CLAUDE.md`).

| File | Spec | Producer | Consumers | Status |
|---|---|---|---|---|
| `openapi-risk-engine-v1.yaml` | OpenAPI 3.1 (API 1.1.0) | risk-engine | frontend, payment-gateway, llm-insights | Imported from design v2.0. Not frozen. JWT security pending |
| `openapi-payment-gateway-v1.yaml` | OpenAPI 3.1 (API 1.0.0) | payment-gateway | merchants, frontend | Imported from design v2.0. Not frozen. JWT on ops endpoints and `POST /api/v1/merchants/me` pending |
| `asyncapi-events-v1.yaml` | AsyncAPI 3.0 (API 1.1.0) | payment-gateway, risk-engine, llm-insights | all services | Adds `risk.insights.v1`; existing topics/messages unchanged. Not frozen |
| `openapi-ml-scorer-v1.yaml` | OpenAPI 3.1 (API 1.0.0) | ml-scorer | risk-engine | Written in RISK-140. Not frozen (freeze point H1, Tue 1 Dec 2026). Internal only, no authentication |
| `openapi-llm-insights-v1.yaml` | OpenAPI 3.1 (API 1.0.0) | llm-insights | frontend | RISK-100 draft: five JWT-protected advisory/console APIs; producer/consumer review required before H11 |

The Risk Engine and Gateway OpenAPI files remain imported from design v2.0; their JWT and merchant-provisioning
changes are still pending under RISK-100. The original AsyncAPI messages/schemas are preserved while insights is added.
Q12 remains open for calls into the Risk Engine; this additive slice does not choose its service-to-service authentication.

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
