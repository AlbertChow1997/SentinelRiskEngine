# Changelog

All notable changes to this project are recorded here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and the project uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- RISK-12 backend CI: Java 21 Maven verification, coverage/test artifacts and weekly Maven dependency updates.

- RISK-11 backend M0 skeleton: Java 21 / Spring Boot 4.1.2, health, JSON logs, request correlation, tests and container.
- ADR-0008 records the Java/Maven/PostgreSQL baseline and resolves Q18.

- Repository skeleton: component folders, hygiene files, CODEOWNERS, PR and issue templates, Dependabot.
- Living documents: `docs/DESIGN.md` (v3.0), `docs/ROADMAP.md`, `docs/TECH_DECISIONS.md`.
- ADR-0001 (record architecture decisions), ADR-0007 (single-host ECS staging), ADR-0009 (FastAPI for the Python services).
- Contracts imported from design v2.0: Risk Engine API, Payment Gateway API, domain events.
- Tooling: `Makefile`, local `docker-compose.yml` (PostgreSQL + Kafka), `contracts.yml` and `codeql.yml` workflows.
- MIT licence.
- Skeletons for runbooks, the ORR checklist, the threat model and post-incident reviews.

### Changed

- RISK-107: staging Region is now eu-north-1 (ADR-0015); Terraform takes the Region from one `region` variable.
- Standardised PostgreSQL 18 in documentation and future environment requirements; corrected the Compose volume mount and held Dependabot database upgrades within major 18.
