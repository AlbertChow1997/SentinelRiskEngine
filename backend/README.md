# Risk Engine (`backend/`)

Real-time transaction risk assessment: deterministic rules, an ML score, analyst review and an audit trail.

| | |
|---|---|
| **Owner** | Jiawei Zhou (@AlbertChow1997) |
| **Stack** | Java 21, Spring Boot 4.2.0, Maven 3.10.2 via Wrapper 3.3.4; PostgreSQL 18 is the persistence target |
| **Port** | 8081 |
| **Contract** | `contracts/openapi-risk-engine-v1.yaml`; `contracts/asyncapi-events-v1.yaml` |
| **Design** | `docs/DESIGN.md` sections 4.3-4.4 and 7; [ADR-0008](../docs/adr/0008-core-technology-stack.md) |
| **Status** | RISK-11 M0 skeleton: health, JSON logs, request correlation, tests and container. Business APIs follow in M1 |

## Run and verify

Install JDK 21 and set `JAVA_HOME` to it. A separate Maven installation is unnecessary.

```bash
cd backend
./mvnw -B verify                 # formatting, tests, executable jar and JaCoCo report
./mvnw spotless:apply            # Google Java Format
./mvnw spring-boot:run           # no PostgreSQL, Kafka or AWS dependency at M0
curl -i -H 'X-Request-Id: smoke-123' http://localhost:8081/actuator/health
```

On Windows use `mvnw.cmd` instead of `./mvnw`. Health returns HTTP 200 with `status: UP` and echoes `X-Request-Id`.
Missing or unsafe IDs are replaced with a UUID; the logging context is restored after each request.
Only health is exposed through Actuator; component details and environment/configuration endpoints are hidden.
Liveness and readiness are at `/actuator/health/liveness` and `/actuator/health/readiness`.

From the repository root, `docker compose up --build -d risk-engine` starts only this service. `make up` starts the
local stack after `.env` is configured. The runtime runs as UID 10001 with a 512 MB Compose memory limit.

```bash
docker buildx build --platform linux/arm64 --load -t sentinel-risk-engine:local backend
```

The multi-stage build runs `verify` using JDK 21 on the build host's architecture, then copies the portable Java jar
into the target architecture's JRE image.
PostgreSQL 18 mounts its named volume at `/var/lib/postgresql`. Back up and explicitly migrate existing database data
when its major version or volume layout changes. Never delete a volume to upgrade it.

## Included and next

- `RiskEngineApplication`: Spring Boot entry point.
- `common/web/RequestIdFilter`: safe correlation IDs, response header and MDC integration.
- `application.yml`: port, graceful shutdown, health-only Actuator and structured Logstash JSON output.
- Tests: real HTTP health checks, hidden Actuator endpoints, safe IDs and context cleanup on failure.
- `pom.xml`: release 21, pinned formatting and JaCoCo report at `target/site/jacoco/index.html`.
- Official Unix/Windows Maven wrappers, multi-stage Dockerfile and minimal build context.

Entities/migrations, risk APIs, rules, scoring, ML calls, JWT and Kafka follow in their implementation tickets.
`ci-backend.yml` always reports the stable `Verify backend (Java 21)` check on PRs and main pushes.
Internal change detection runs Temurin 21 and `./mvnw -B -ntp verify` for backend/contracts/CI inputs;
unrelated changes report success without Maven. Manual runs always verify. Missing git history runs verification safely.
Maven dependencies and Wrapper distributions are cached separately. Coverage/test artifacts are retained for 14 days.
Only superseded PR runs are cancelled; every main run has its own concurrency group.
Maven Dependabot checks `backend/` weekly and ignores major updates pending a team decision;
add a separate gateway entry only when its POM exists, without overlapping `/backend`.
Container-build CI and core-package JaCoCo thresholds remain explicit follow-ups; the M0 scaffold has no rules/domain service yet.
See [`CLAUDE.md`](CLAUDE.md) for conventions.
