# CLAUDE.md — Risk Engine (`backend/`)

Read the root `CLAUDE.md` first; this file only adds what is specific to this folder.
Owner: Jiawei Zhou. Design: `docs/DESIGN.md` §4.3–4.4 and §7. Contract: `contracts/openapi-risk-engine-v1.yaml`.

## Status

Not scaffolded yet. The commands below are the target once RISK-11 lands; until then `make test-backend` prints "skipped".

## Stack

- Java 21, Spring Boot 4 (confirm the exact line before generating — open question Q18), Maven wrapper.
- Spring Web, Validation, Spring Data JPA, PostgreSQL driver, Flyway, Actuator, Spring for Apache Kafka, Spring Security OAuth2 Resource Server.
- `resilience4j-circuitbreaker` (core library, used programmatically), springdoc-openapi (Boot 4 line), WireMock and Testcontainers for tests.
- **Check versions against official docs or the `pom.xml`.** AI tools often produce Spring Boot 3 APIs.

## Commands

```bash
./mvnw -B verify                 # unit + Testcontainers integration tests, JaCoCo report
./mvnw spotless:apply            # format (Google Java Format)
./mvnw spotless:check            # what CI runs
./mvnw spring-boot:run           # needs `make up` for PostgreSQL and Kafka; listens on :8081
```

Integration tests need a running Docker daemon (Testcontainers).

## Conventions

- Base package `com.albertchow.riskengine`, **package-by-feature**: `assessment`, `rules`, `context`, `ml`, `blocklist`, `stats`, `common` (`DESIGN.md` §7.2).
- Constructor injection only; records for DTOs; `BigDecimal` for money; `java.time` with an injected `Clock`.
- Errors are RFC 9457 Problem Details with a `code` field for business errors.
- A new rule is one new `@Component` implementing `RiskRule`. Nothing else changes.
- Scoring weights and thresholds live in `application.yml` under `risk.*`, never in code.
- Never hold a database transaction open across an HTTP call.
- Events go through the outbox table in the same transaction as the business change; consumers dedupe on `eventId`.
- Schema changes are new Flyway files (`V<n>__description.sql`). Never edit an applied migration.
- Do not share Java code with `payment-gateway/`. Share contracts, not code.
- Log with `X-Request-Id` in the MDC. Never log secrets, tokens or full request bodies.

## Tests

- Unit: every rule, `ScoreAggregator` (thresholds, escalation, hard decline, degraded), request hashing.
- Web slice (`@WebMvcTest`): validation, Problem Details, 404/409 mapping, role checks.
- Integration (`@SpringBootTest` + Testcontainers): repositories, context builder, idempotency race, optimistic locking, outbox.
- ML client against WireMock stubs built from the ML contract; timeout → fallback.
- Coverage target: at least 80 % on `rules` and `assessment.service`.
