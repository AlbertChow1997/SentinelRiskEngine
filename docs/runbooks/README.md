# Runbooks

One runbook per service: `docs/runbooks/<service>.md`. A runbook is written for the person who has to fix the service at a bad
moment, possibly not its author. Keep it short and concrete.

| Service | Runbook | Owner | Due |
|---|---|---|---|
| payment-gateway | `payment-gateway.md` | Jiawei | M5 |
| risk-engine | `risk-engine.md` | Jiawei | M5 |
| ml-scorer (and ml-feedback) | `ml-scorer.md` | Zheng | M5 |
| llm-insights | `llm-insights.md` | Zheng (proposed) | M5 |
| Staging platform (EC2 host, ECS, Kafka, PostgreSQL, CloudFront) | `staging-platform.md` | Jiawei | M0, then kept current |

The Operational Readiness Review checklist is in [`orr-checklist.md`](orr-checklist.md).

## Template

```markdown
# Runbook: <service>

## Purpose
What the service does and what breaks for users when it is down.

## Dependencies
Upstream and downstream services, databases, topics, AWS resources.

## Dashboards and logs
CloudWatch dashboard, log group names, useful Logs Insights queries.

## Alarms
| Alarm | Meaning | First action |

## Common failures and fixes
| Symptom | Likely cause | Fix |

## How to roll back
Exact steps (previous task definition revision, previous image tag, migration notes).

## How to restart / wake / sleep
Commands, expected duration, how to tell it worked.
```
