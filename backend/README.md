# Risk Engine (`backend/`)

Real-time transaction risk assessment: deterministic Java rules combined with an ML score, analyst review, and a full audit trail.

| | |
|---|---|
| **Owner** | Jiawei Zhou (@AlbertChow1997) |
| **Stack** | Java 21, Spring Boot 4, Maven, PostgreSQL 17 (database `sentinel`), Flyway, Spring for Apache Kafka |
| **Port** | 8081 |
| **Contract** | `contracts/openapi-risk-engine-v1.yaml`; events in `contracts/asyncapi-events-v1.yaml` |
| **Design** | `docs/DESIGN.md` §4.3–4.4, §7 |
| **Status** | Not scaffolded yet — first ticket RISK-11 (milestone M1) |

Working conventions for this folder are in [`CLAUDE.md`](CLAUDE.md).
