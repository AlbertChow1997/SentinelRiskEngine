# Sentinel Pay — Threat model (STRIDE)

| | |
|---|---|
| **Status** | Skeleton. The first full pass is due with the authentication work (M3), and it is reviewed again in the ORR before release (M5) |
| **Method** | Microsoft SDL threat modelling with STRIDE: Spoofing, Tampering, Repudiation, Information disclosure, Denial of service, Elevation of privilege |
| **Update when** | A PR adds an entry point, a data store or an external dependency — in that same PR |

## 1. Scope and assets

| Asset | Why it matters |
|---|---|
| Payment and ledger records | Integrity of money movements, even though the money is simulated |
| Risk decisions and audit trail | Must be attributable and tamper-evident |
| Merchant API keys (stored as hashes) | Allow creating payments on a merchant's behalf |
| User identities and roles (Cognito) | Control who can review, administer and inspect |
| LLM prompts and responses | Must contain no personal data; reveal risk logic |
| AWS account and deploy pipeline | Full control of the environment and its cost |

Out of scope: real card data (never accepted — cards are test tokens), a production environment.

## 2. Trust boundaries and entry points

```text
Internet ──▶ CloudFront ──▶ [boundary: security group + secret header] ──▶ nginx ──▶ services on the EC2 host
Browser  ──▶ Cognito Hosted UI
GitHub Actions ──▶ [boundary: OIDC role] ──▶ AWS APIs
llm-insights ──▶ [boundary: instance role] ──▶ Bedrock
```

| # | Entry point | Authentication | Added in |
|---|---|---|---|
| EP1 | `POST/GET /api/v1/payments/**` | `X-API-Key` | M2 |
| EP2 | `/api/v1/ops/**`, analytics | JWT (`analyst` / `admin`) | M2, secured in M3 |
| EP3 | Risk Engine analyst APIs | JWT (`analyst` / `admin`) | M1, secured in M3 |
| EP4 | `POST /api/v1/merchants/me` | JWT (`merchant`) | M3 |
| EP5 | `/api/v1/insights/**`, `/api/v1/llm/**` | JWT (`analyst` / `developer` / `admin`) | M4 |
| EP6 | Kafka topics | Network-internal only | M2 |
| EP7 | Deploy pipeline | GitHub OIDC + environment approval | M0 |
| EP8 | SSM Session Manager | IAM | M0 |

## 3. Threats and mitigations

Seed entries from the design. Each row needs an owner and a status once the component exists.

| ID | STRIDE | Threat | Mitigation | Status |
|---|---|---|---|---|
| T01 | Spoofing | A request reaches the origin without passing through CloudFront | Security group limited to the CloudFront prefix list; nginx rejects requests without the secret header | Planned (M0) |
| T02 | Spoofing | Forged or expired JWT | Signature, issuer, audience and expiry validated against the Cognito JWKS in every backend | Planned (M3) |
| T03 | Spoofing | Stolen merchant API key | Keys stored as SHA-256 hashes, shown once, rotatable from `/product` | Planned (M2–M3) |
| T04 | Tampering | Replayed or altered payment request | `Idempotency-Key` with a request hash; state machine rejects invalid transitions | Planned (M2) |
| T05 | Tampering | Forged event on a Kafka topic | Broker reachable only inside the host; consumers validate the envelope and dedupe on `eventId` | Planned (M2) |
| T06 | Repudiation | An analyst denies a review decision | Reviewer taken from the JWT; append-only audit events | Planned (M3) |
| T07 | Information disclosure | A merchant reads another merchant's data | Every query scoped by merchant; cross-tenant access returns 404 | Planned (M2–M3) |
| T08 | Information disclosure | Personal data leaks into LLM prompts or logs | Prompt input built from a field allow-list; prompts and responses never logged | Planned (M4) |
| T09 | Information disclosure | Traffic between CloudFront and the origin is read in transit | Accepted risk for staging (ADR-0007); path stays on the AWS network edge; no real personal or card data exists | Accepted |
| T10 | Information disclosure | Secrets committed to Git or baked into images | SSM Parameter Store, `.env.example` only, CodeQL, Trivy, review | In place (process) |
| T11 | Denial of service | Public endpoints flooded; LLM cost driven up | CloudFront in front; LLM calls are triggered only by internal events and capped by a daily budget | Planned (M0, M4) |
| T12 | Denial of service | AWS bill run up | Budgets alerts, scheduled stop, resource tags | Planned (M0) |
| T13 | Elevation of privilege | A user grants themself a role | Roles are Cognito groups; only an admin assigns them; backends trust only the signed claim | Planned (M3) |
| T14 | Elevation of privilege | Prompt injection through transaction fields makes the LLM output misleading text | Output schema validation; the LLM is advisory and cannot act; fields are typed and length-limited before rendering | Planned (M4) |
| T15 | Elevation of privilege | A compromised workflow deploys to AWS | OIDC role limited to this repository and branch; environment approval gate; least-privilege IAM policy | Planned (M0) |

## 4. Review log

| Date | Change | Reviewer |
|---|---|---|
| 11 Nov 2026 | Skeleton created with seed threats from `DESIGN.md` | — |
