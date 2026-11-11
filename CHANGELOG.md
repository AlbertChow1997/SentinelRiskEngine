# Changelog

All notable changes to this project are recorded here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and the project uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Repository skeleton: component folders, hygiene files, CODEOWNERS, PR and issue templates, Dependabot.
- Living documents: `docs/DESIGN.md` (v3.0), `docs/ROADMAP.md`, `docs/TECH_DECISIONS.md`.
- ADR-0001 (record architecture decisions), ADR-0007 (single-host ECS staging), ADR-0009 (Django for the Python services).
- Contracts imported from design v2.0: Risk Engine API, Payment Gateway API, domain events.
- Tooling: `Makefile`, local `docker-compose.yml` (PostgreSQL + Kafka), `contracts.yml` and `codeql.yml` workflows.
- Skeletons for runbooks, the ORR checklist, the threat model and post-incident reviews.
