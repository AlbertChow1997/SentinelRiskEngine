# CLAUDE.md — Risk Engine (`backend/`)

Read the root `CLAUDE.md` first; this file only adds what is specific to this folder.
Owner: Jiawei Zhou. Design: `docs/DESIGN.md` §4.3–4.4 and §7. Contract: `contracts/openapi-risk-engine-v1.yaml`.

## Status

RISK-11 provides the M0 walking skeleton: health, JSON logs, request IDs, tests and an ARM64-capable container.
It starts without PostgreSQL, Kafka or AWS. Persistence and business APIs arrive in M1.
RISK-116 (#56) adds the contract-shaped `POST /api/v1/risk-assessments` stub (fixed APPROVE, degraded, nothing stored),
Bean Validation and `GlobalExceptionHandler` (RFC 9457 with `code` and field `errors`). It is unauthenticated until RISK-111
(threat model T18); add JWT validation before the endpoint stores or reads data.
RISK-12 (#7) adds `ci-backend.yml`: Java 21 verification, coverage/test artifacts (its Maven Dependabot updates were removed on 26 Nov 2026; upgrades are manual, D20).
Its stable check always reports; internal path detection skips Maven for unrelated changes.
Main runs are never replaced by a newer run; dependency and Wrapper caches are separate.

## Stack

- Java 21, Spring Boot 4.2.0, Maven 3.10.2 via Maven Wrapper 3.3.4 (ADR-0008, Q18 closed).
- Current dependencies: Spring MVC, Validation (Hibernate Validator), Actuator and Spring MVC test support; test-only
  networknt json-schema-validator 3.x, which checks responses against `contracts/openapi-risk-engine-v1.yaml`.
  Those contract tests skip only when `../contracts` is missing outside CI (the image build uses `backend/` as context).
- Planned with implementation tickets: JPA, PostgreSQL 18 driver, Flyway, Kafka and OAuth2 Resource Server.
- Add resilience4j, springdoc-openapi, WireMock and PostgreSQL 18 Testcontainers only with the features that use them.
- **Check versions against official docs or the `pom.xml`.** AI tools often produce Spring Boot 3 APIs.

## Commands

```bash
./mvnw -B verify                 # formatting, unit/HTTP tests, executable jar and JaCoCo report
./mvnw spotless:apply            # format (Google Java Format)
./mvnw spotless:check            # what CI runs
./mvnw spring-boot:run           # standalone M0 service; listens on :8081
```

On Windows use `mvnw.cmd`. The current tests need no Docker daemon. Future Testcontainers integration tests will need one.

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
