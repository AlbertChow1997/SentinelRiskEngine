# Payment Gateway (`payment-gateway/`)

Merchant-facing payments API: create, capture, cancel and refund payments with idempotency, a risk check before authorisation,
a simulated acquirer, a double-entry ledger and domain events through a transactional outbox.

| | |
|---|---|
| **Owner** | Jiawei Zhou (@AlbertChow1997) |
| **Stack** | Java 21, Spring Boot 4, Maven, PostgreSQL 18 (database `gateway`), Flyway, Spring for Apache Kafka |
| **Port** | 8080 |
| **Contract** | `contracts/openapi-payment-gateway-v1.yaml`; events in `contracts/asyncapi-events-v1.yaml` |
| **Design** | `docs/DESIGN.md` §4.5–4.7, §10, §11 |
| **Status** | Not scaffolded yet — first ticket RISK-70 (milestone M2) |

No card numbers (PAN) are ever accepted or stored. Cards are test tokens and the acquirer is simulated.

Working conventions for this folder are in [`CLAUDE.md`](CLAUDE.md).
