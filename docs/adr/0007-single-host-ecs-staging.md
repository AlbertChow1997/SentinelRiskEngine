# ADR-0007: Run staging on a single EC2 host with ECS and scheduled start/stop

| | |
|---|---|
| **Status** | Accepted |
| **Date** | 11 Nov 2026 |
| **Deciders** | Jiawei Zhou (tech lead, owner of `infra/`) |
| **Related** | `DESIGN.md` §19 · `TECH_DECISIONS.md` D05, D11–D15 |

## Context

Sentinel Pay needs one publicly reachable environment for demos and interviews. It has to run five application containers
(payment-gateway, risk-engine, ml-scorer, ml-feedback, llm-insights), PostgreSQL, Kafka and a reverse proxy, plus a static
website, sign-in and an LLM.

Constraints:

- **Cost.** This is a self-funded portfolio project. The target is about $20–28 a month.
- **Usage pattern.** The environment is looked at for minutes at a time, mostly on weekdays. Idle hours are wasted money.
- **Credibility.** The setup should use the same building blocks as a production AWS deployment (ECS task definitions, IaC, a pipeline, IAM roles) so that the migration path is short and the skills transfer.
- **Team.** One person operates it, part-time.

## Options

1. **Fargate + ALB + RDS (+ MSK)** — the production shape. Managed and highly available, but an ALB (~$18/month), RDS, per-task compute and a managed Kafka cluster together cost several times the budget.
2. **One EC2 host running ECS, started and stopped on a schedule** — all containers on one Graviton instance; CloudFront and S3 in front; managed services only where they are free or nearly free.
3. **App Runner** — simple for stateless HTTP services, but there is nowhere to run Kafka and PostgreSQL, and per-service charges add up.
4. **Lightsail or a plain VM with docker compose** — cheapest and simplest, but little of it carries over to a production AWS setup, and deploys would be manual.
5. **Non-AWS hosts (Oracle Free Tier, Hetzner)** — cheapest compute, but no integration with Cognito, Bedrock, IAM or the AWS tooling the project wants to demonstrate.

## Decision

Database baseline updated to PostgreSQL 18 on 16 Nov 2026 at the owner's request; see ADR-0008.

Run all backend containers with **ECS on one EC2 `t4g.medium` (ARM64) instance** in eu-west-1 (superseded: eu-north-1, see ADR-0015), and start and stop that instance
on a schedule. Specifically:

- **Compute:** one standalone On-Demand instance (not an Auto Scaling Group), so stopping and starting keeps its EBS volumes. ECS-optimised Amazon Linux 2023 AMI resolved from the public SSM parameter. A separate 20 GB gp3 data volume mounted at `/data` holds PostgreSQL and Kafka data.
- **Orchestration:** one ECS service per component, bridge networking with static host ports, `minimumHealthyPercent = 0` and `maximumPercent = 100`, deployment circuit breaker with rollback. Services reach each other through the Docker bridge gateway address.
- **Ingress:** CloudFront serves the React build from a private S3 bucket (Origin Access Control) and forwards `/api/*` to the instance over HTTP. The security group admits port 80 only from the CloudFront origin-facing prefix list, and nginx rejects requests without a secret header that only CloudFront sends.
- **Network:** public subnet with an Elastic IP; no NAT Gateway and no ALB. No SSH: access is through SSM Session Manager.
- **Data:** PostgreSQL 18 and a single-broker KRaft Kafka as containers; nightly `pg_dump` to S3 and daily EBS snapshots through Data Lifecycle Manager.
- **Schedule:** EventBridge Scheduler starts the instance at 09:00 and stops it at 23:00, Monday to Friday, Europe/Dublin time. `make aws-wake` and `make aws-sleep` override it by hand.
- **Managed services kept:** S3, CloudFront, Cognito, Bedrock, ECR, SSM Parameter Store, CloudWatch, AWS Budgets.
- **Everything is Terraform**, applied only after explicit approval; images are ARM64 only.

Production would use Fargate + ALB + Multi-AZ RDS. That is the documented migration path, not the current build.

## Consequences

**Accepted trade-offs**

- **No high availability.** One host: a failure means rebuilding from the latest snapshot. Each deploy restarts the affected service for a short time, because one host with static ports cannot run old and new tasks side by side.
- **Unencrypted hop.** Traffic between CloudFront and the origin is HTTP. It is restricted to CloudFront by the prefix-list rule and the secret header. Production would use an own domain and TLS to the origin.
- **Self-managed PostgreSQL and Kafka.** We own backups, restores and upgrades. The outbox tables stay the source of truth for events, so losing the broker loses no business data.
- **Tight memory.** The container budget is about 3.3 GB of 4 GB. Container limits, `-XX:MaxRAMPercentage=75` and a 2 GB swap file are the safety net; the next step is `t4g.large`.
- **The backend sleeps.** Outside the window the API is down. The website and `/sample` stay available, and the web app shows a "sleeping" banner. Alarms use `treat_missing_data = notBreaching` so scheduled downtime does not raise them.
- **The Elastic IP is billed around the clock**, including while the instance is stopped.

**What we gain**

- Indicative cost of about $20–28 a month instead of about $40–45 for the same host running continuously, and far less than the production shape (cost table in `TECH_DECISIONS.md` D12).
- Real ECS task definitions, IAM roles, ECR, OIDC deploys and Terraform modules — the pieces that carry over.

**Migration path to the production shape**

Swap the `ecs-ec2-host` module for Fargate services behind an ALB, move PostgreSQL to RDS and Kafka to MSK. The `ecs-service`
module and the task definitions stay largely the same.

**Revisit when**

- Out-of-memory kills appear.
- The project gets its own domain.
- The environment needs to be available outside the scheduled window regularly.

Update, 23 November 2026: the Region is now eu-north-1 because the team's AWS project is locked to it. Everything else in this ADR is unchanged. See ADR-0015.

Update, 23 November 2026 (RISK-106): during development the window is every day 19:00-02:00 Europe/Dublin. The Monday to Friday 09:00-23:00 demo window returns before release (RISK-117). The schedule module now takes the window only from the root's `start_cron`/`stop_cron` variables.

Update, 23 November 2026 (ADR-0016): while the AWS project is on the Free plan the host is `t4g.small` (2 GiB), enough for M0. The full stack returns to `t4g.medium` after a Paid-plan upgrade or an alternative recorded before M1.
