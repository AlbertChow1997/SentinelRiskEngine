# Risk Engine — M0 runbook

Owner: Jiawei Zhou. Scope: RISK-11 health-only skeleton. Staging deployment, dashboards and alarms follow in M0 infra/CI tickets.

## Purpose and dependencies

The process runs on port 8081 and exposes Actuator health only. It has no database, Kafka, ML or AWS runtime dependency yet.
Business APIs and persistence arrive in M1. Logs are JSON; request logs use the `requestId` MDC field.

## Start and check locally

```bash
docker compose up --build -d risk-engine
curl -i -H 'X-Request-Id: ops-smoke' http://localhost:8081/actuator/health
docker compose ps risk-engine
docker compose logs --tail 100 risk-engine
```

Expected: HTTP 200, `status: UP`, the request ID echoed in the response. Only health is exposed; `/actuator/env` returns 404.
For request completion diagnostics, temporarily set `LOGGING_LEVEL_COM_ALBERTCHOW_RISKENGINE_COMMON_WEB=DEBUG`.
Do not put secrets or personal data in request IDs. Invalid IDs are replaced with a UUID.

## Recovery and rollback

- Build failure: run `backend/mvnw -f backend/pom.xml -B verify` (Windows: `backend/mvnw.cmd`) with JDK 21; inspect test output.
- Port 8081 occupied: identify the owning process before stopping it, or map a different host port locally.
- Unhealthy container: inspect logs and its health output with `docker inspect`; restart only this service using
  `docker compose restart risk-engine` after addressing the cause.
- Stop the local service with `docker compose stop risk-engine`. No database data is stored by this scaffold.
- Roll back by rebuilding a previously reviewed commit or redeploying the previous image tag when staging CI exists.

PostgreSQL 18 uses a named volume mounted at `/var/lib/postgresql`. Before changing an existing database volume layout,
inspect its data and take a backup; use explicit dump/restore or `pg_upgrade` for a major upgrade. Do not remove volumes.
