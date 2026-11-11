# CLAUDE.md — Payment Gateway (`payment-gateway/`)

Read the root `CLAUDE.md` first; this file only adds what is specific to this folder.
Owner: Jiawei Zhou. Design: `docs/DESIGN.md` §4.5–4.7, §10 and §11. Contract: `contracts/openapi-payment-gateway-v1.yaml`.

## Status

Not scaffolded yet. The commands below are the target once RISK-70 lands; until then `make test-gateway` prints "skipped".

## Stack

- Java 21, Spring Boot 4 (same line as `backend/` — Q18), Maven wrapper.
- Spring Web, Validation, Spring Data JPA, PostgreSQL driver, Flyway, **Spring for Apache Kafka**, Actuator, Spring Security OAuth2 Resource Server.
- `resilience4j-circuitbreaker` (core), `ulid-creator`, springdoc-openapi; WireMock, Testcontainers (PostgreSQL and Kafka) and Awaitility for tests.
- **Check Spring Boot 4 and Spring Kafka APIs against official docs or the `pom.xml`.**

## Commands

```bash
./mvnw -B verify                 # unit + Testcontainers (PostgreSQL and Kafka) tests, JaCoCo report
./mvnw spotless:apply            # format
./mvnw spotless:check            # what CI runs
./mvnw spring-boot:run           # needs `make up`; listens on :8080
```

## Conventions

- Base package `com.albertchow.gateway`, **package-by-feature**: `payment`, `merchant`, `idempotency`, `risk`, `acquirer`, `ledger`, `events`, `stats`, `common` (`DESIGN.md` §10.2).
- **`PaymentStateMachine.transition(...)` is the only place a payment status changes.** Every transition writes a status-history row and, where an event exists, an outbox row in the same transaction.
- **Never hold a database transaction open across an HTTP call** (risk engine, acquirer). Persist the intermediate status first.
- Money is `BigDecimal` and `NUMERIC(14,2)`; fees round with `RoundingMode.HALF_EVEN`. No floating point, ever.
- Money-moving `POST`s require `Idempotency-Key`; behaviour per `DESIGN.md` §10.5.
- API keys are stored as SHA-256 hashes, never in plain text, never logged.
- Every query is scoped by merchant. Another merchant's resource is **404, not 403**.
- Ledger rows are append-only; a correction is a new journal.
- Never accept, store or log a card number. `payment_method_token` is a test token.
- Consumers dedupe on `eventId` (`processed_event`) and acknowledge after the transaction commits.
- Constructor injection, records for DTOs, injected `Clock`, RFC 9457 Problem Details.
- Do not share Java code with `backend/`. Copy the small bits you need.

## Tests

- Unit: every allowed and forbidden state transition, fee calculation and rounding, ledger balance invariants, fallback policy, request hashing.
- Web slice: validation, API-key filter (401, 404 scoping), JWT roles on ops endpoints, Problem Details codes.
- Integration: create → capture → refund on real PostgreSQL; idempotency race; optimistic locking; outbox row → Kafka message; duplicate event processed once; poison message → DLT.
- Risk Engine client against WireMock stubs from the risk contract; timeouts → fallback.
- Coverage target: at least 80 % on `payment.domain`, `payment.service`, `idempotency`, `ledger`.
