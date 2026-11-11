# Operational Readiness Review (ORR) checklist

This checklist must pass before each release. Copy it into the release PR or issue, tick each item, and link the evidence.
An item that does not apply is marked "N/A" with a reason — never silently skipped.

**Release:** `vX.Y.Z` · **Date:** · **Reviewer (not the author):**

## 1. Health and observability

- [ ] Every service exposes a health endpoint, and the deploy smoke test calls it through CloudFront.
- [ ] Logs are structured JSON, carry `X-Request-Id`, and contain no secrets, tokens, full request bodies, prompts or personal data.
- [ ] Every service has at least one CloudWatch alarm, and each alarm names a first action in the runbook.
- [ ] Alarms use `treat_missing_data = notBreaching`, so scheduled downtime does not raise them.
- [ ] The CloudWatch dashboard shows request rate, error rate and latency for the gateway and the risk engine.

## 2. Resilience

- [ ] ML scorer down → risk engine answers from rules, flagged `degraded` (E7).
- [ ] Risk engine down → gateway fallback policy applies (P10).
- [ ] Kafka down → payments continue, outbox drains on recovery (P11).
- [ ] LLM provider down → payments and reviews unaffected (L3).
- [ ] LLM daily budget exceeded → calls stop (L4).
- [ ] Stuck-payment and review-timeout jobs verified.

## 3. Deploy and rollback

- [ ] The release was deployed to staging only through `deploy-staging.yml`, with the approval gate.
- [ ] A rollback was rehearsed: the previous task definition revision was restored and the smoke test passed.
- [ ] Database migrations in this release are backward compatible with the previous application version, or the rollback plan says otherwise.
- [ ] The system is usable within 5 minutes of `make aws-wake`.

## 4. Data and backups

- [ ] The nightly `pg_dump` exists in S3 for the last 7 days, and one restore was tested.
- [ ] Daily EBS snapshots exist (Data Lifecycle Manager, keep 7).
- [ ] No card numbers (PAN), names or emails are stored or logged anywhere. LLM prompts contain no personal data.

## 5. Security

- [ ] No secrets in Git, images or task definitions; all are in SSM Parameter Store.
- [ ] No long-lived AWS keys; GitHub Actions uses OIDC.
- [ ] CodeQL and Trivy show no new high or critical findings.
- [ ] Every endpoint other than health requires an API key or a JWT; role and cross-tenant (404) tests pass.
- [ ] The security group admits port 80 only from the CloudFront prefix list; there is no port 22.
- [ ] `docs/threat-model.md` covers every entry point, data store and external dependency in this release.

## 6. Cost

- [ ] AWS Budgets alerts exist at $15 (forecast) and $25 (actual).
- [ ] Every resource carries the tags `project=sentinel-pay`, `owner`, `env=staging`.
- [ ] Last month's bill matches the estimate in `TECH_DECISIONS.md` D12, or the difference is explained.
- [ ] The scheduled start and stop both ran on the last working day.

## 7. Documentation

- [ ] `DESIGN.md`, `ROADMAP.md` and `TECH_DECISIONS.md` match what is deployed.
- [ ] Every service has a current runbook in `docs/runbooks/`.
- [ ] `CHANGELOG.md` and the release notes are written.
- [ ] The README states that this is a portfolio project with synthetic data, a simulated acquirer and demo pricing.

## Outcome

- [ ] **Pass** — release may be tagged.
- [ ] **Pass with follow-ups** — list the tickets:
- [ ] **Fail** — list the blocking items:
