# ADR-0008: Use Java 21, Spring Boot 4.1 and PostgreSQL 18

| | |
|---|---|
| **Status** | Accepted |
| **Date** | 16 Nov 2026 |
| **Deciders** | Jiawei Zhou (tech lead); PostgreSQL 18 explicitly confirmed by the project owner |
| **Related** | RISK-11 (#6), RISK-101 (#5); `TECH_DECISIONS.md` D01, D02, D03, D10; closes Q18 |

## Context

The M0 walking skeleton needs a reproducible Java build and an ARM64 container. The original design named Spring Boot
4.0.x and PostgreSQL 17, while Compose already used PostgreSQL 18. The owner confirmed PostgreSQL 18 on 16 Nov 2026.
No service schema or production database has been deployed by this repository.

## Options

1. Keep Spring Boot 4.0.x and revert PostgreSQL to 17: preserves the original text but contradicts the owner's database decision.
2. Java 21, stable Spring Boot 4.1.x and PostgreSQL 18: aligns the new scaffold, current official tooling and all environments.
3. Change language, build tool or database: adds migration work without solving an M0 requirement.

## Decision

Use Java 21, Spring Boot **4.1.2**, Maven **3.10.1** via the official Maven Wrapper **3.3.4**, and PostgreSQL **18**
for local development, future Testcontainers integration tests and staging. Keep GitHub Actions for CI/CD.
The initial backend includes Spring MVC and Actuator only. Persistence/Flyway, validation, security, Kafka and ML clients
are added with their implementation tickets, so the M0 process starts without infrastructure credentials.

The official [Spring Boot system requirements](https://docs.spring.io/spring-boot/system-requirements.html)
list 4.1.2 as stable and support Java 21. Wrapper files come from [Spring Initializr](https://start.spring.io/).
Dependency versions are pinned in `backend/pom.xml` and `.mvn/wrapper/maven-wrapper.properties`.

## Consequences

- Maven compiles with Java release 21; container stages use Eclipse Temurin 21 and support the ARM64 staging target.
- PostgreSQL 18's official image needs its volume at `/var/lib/postgresql`, with data under `18/docker`, per the
  [official image documentation](https://hub.docker.com/_/postgres). Compose and the target design use that layout.
- Existing PostgreSQL 17 data requires an explicit dump/restore or `pg_upgrade`; changing an image tag is not a migration.
  Do not delete existing volumes. Inspect and back up existing data before changing an established local stack.
- Dependabot may update PostgreSQL within 18; major database upgrades require a new explicit decision.
- Revisit framework/library compatibility as persistence, OpenAPI tooling and security are added. This scaffold does not
  choose versions for libraries it does not yet use.
