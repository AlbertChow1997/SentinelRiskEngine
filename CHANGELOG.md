# Changelog

All notable changes to this project are recorded here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and the project uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- RISK-106: ECS host, reusable ECS service and start/stop scheduler modules, and confirmed wake/sleep/status scripts (re-landed from #30 with its review fixes). Development schedule: every day 19:00-02:00 Europe/Dublin (demo window returns in RISK-117).
- RISK-115: AWS Agent Toolkit starter rules in `CLAUDE.md` and `AGENTS.md` (project decisions take precedence; help level HIGH).
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

### Fixed

- RISK-104: nginx sets `map_hash_bucket_size 256` so the origin-secret map accepts the 64-character staging secret (nginx refused to start on Graviton); tests cover 32/64/128-character secrets.
- RISK-105: the deploy waits for the ECS rollout to finish before checking it; `services-stable` returned 25 s before ECS marked the first rollout COMPLETED, and the deploy reported a false failure.
- RISK-105: deploy role grants `ecs:DescribeTaskDefinition` on `*` (the action has no resource-level permissions); the second deployment attempt was denied.
- RISK-105: GitHub OIDC trust uses the repository's immutable subject (`repo:OWNER@ID/REPO@ID`); the first deployment was refused with AccessDenied.

### Changed

- RISK-164: staging moves to three ECS hosts in three team members' AWS accounts (ADR-0017): host B (engine, Jiawei), host A (gateway + Kafka, Jiajun), host C (ML + LLM, Zheng), joined by cross-account VPC peering after a verification spike. DESIGN §19, CLAUDE.md §7, TECH_DECISIONS D08/D12/D19, threat model (EP10, EP11, T19–T21), ROADMAP (RISK-164 … RISK-170, H14–H19) and CODEOWNERS updated. LLM access: Bedrock with an ECS task role, Claude Haiku 5.5 via the `eu.` profile, no API key (Q19 closed).
- RISK-108: staging host type is a validated ARM64 variable, default t4g.small while the AWS project is on the Free plan (ADR-0016).
- RISK-106: Terraform foundation review fixes from #29: plan-role read permissions, optional existing OIDC provider in CI, module minimum-version constraints, Dependabot-safe and non-cancelling plan job, single sticky plan comment, version read from `.terraform-version`.
- RISK-107: staging Region is now eu-north-1 (ADR-0015); Terraform takes the Region from one `region` variable.
- Standardised PostgreSQL 18 in documentation and future environment requirements; corrected the Compose volume mount and held Dependabot database upgrades within major 18.

### Removed

- RISK-109: obsolete contract compatibility exceptions (`contracts/compatibility/`) and the unused `OASDIFF` Makefile variable.
