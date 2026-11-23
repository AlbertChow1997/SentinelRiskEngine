# ADR-0017: Run staging on three hosts in three AWS accounts

| | |
|---|---|
| **Status** | Accepted by the tech lead on 23 Nov 2026. The network choice depends on the peering spike (RISK-166), and each teammate first confirms their account's Region and plan (RISK-168, RISK-169) |
| **Date** | 23 Nov 2026 |
| **Deciders** | Jiawei Zhou (tech lead, owner of `infra/`); Jiajun Xiao and Zheng Liu own one host each |
| **Related** | RISK-164 (epic) · RISK-165 … RISK-170 · RISK-108 (#52) · ADR-0007 · ADR-0015 · ADR-0016 · `TECH_DECISIONS.md` D08, D12, D19 · `DESIGN.md` §19 |
| **Amends** | ADR-0007 (topology: one host becomes three) · ADR-0016 (reverses its rejection of option 4) |

## Context

- The full staging stack needs about 3.3 GiB of containers (ADR-0007). Our AWS project is on the Free plan. The largest ARM64 type the Free plan allows is `t4g.small` with 2 GiB (ADR-0016). M0 runs on one `t4g.small`.
- Upgrading to the Paid plan cannot be undone, and all spend would then land on one person's account and credit.
- Jiajun and Zheng each have their own AWS account, with their own Free-plan credit.
- The tech lead wants each teammate to own and operate a real piece of the platform. That is part of the portfolio story.
- All Regional resources must be in one Region, eu-north-1 (ADR-0015). That keeps latency low and avoids cross-Region transfer charges.

## Options

1. **Paid plan, one `t4g.medium`** (ADR-0007 as written). Simplest and cheapest overall (about USD 15/month on the development window). But the upgrade is irreversible and all cost sits on one account.
2. **Three `t4g.small` in the tech lead's account.** One network, one state file and one pipeline role. About USD 27/month on one credit, and nobody else operates anything.
3. **Three `t4g.small` in three accounts, one host per person.** Each account's own credit pays for its own host (about USD 9–15/month each). Ownership is real. The cost is cross-account networking, three Terraform states, three OIDC roles and a dependency on two more accounts.
4. **One x86 `c7i-flex.large`** (4 GiB, Free plan). Images, task definitions and the ARM runner pipeline would all change from ARM64 to x86. About USD 27/month.

## Decision

**Option 3.** Every host is a `t4g.small` (ARM64) in **eu-north-1**, in the availability zone with **AZ ID `eun1-az1`**. AZ *names* such as `eu-north-1a` map to different zones in different accounts, so we align on the ID.

| Host | AWS account (owner) | Containers | Memory (incl. ~400 MiB OS + ECS agent) |
|---|---|---|---|
| **B: engine** (the existing host) | Jiawei | nginx (public entry), risk-engine, PostgreSQL 18 (databases `sentinel`, `gateway`, `llm`) | ~1.4 GiB |
| **A: gateway** | Jiajun | payment-gateway, Kafka (KRaft, single broker) | ~1.7 GiB |
| **C: ml** | Zheng | ml-scorer, llm-insights, ml-feedback | ~1.0 GiB |

### Network

The hosts talk over **cross-account VPC peering**, using private IPs only. Same-AZ traffic over peering is free.

| VPC | CIDR | Host private IP |
|---|---|---|
| B (Jiawei) | `10.42.0.0/16` (subnet `10.42.1.0/24`) | `10.42.1.10` (fixed secondary IP added by RISK-165) |
| A (Jiajun) | `10.43.0.0/16` (subnet `10.43.1.0/24`) | `10.43.1.10` |
| C (Zheng) | `10.44.0.0/16` (subnet `10.44.1.0/24`) | `10.44.1.10` |

- Three peerings: B requests B↔A and B↔C. C (Zheng) requests C↔A, and A (Jiajun) accepts it.
- Each side adds routes to the peer CIDRs.
- Security groups admit only the listed ports, and only from the peer host's `/32`.
- Fixed host IPs mean task definitions carry stable addresses. We need no DNS zone and no service mesh.

| From | To | Port | Purpose |
|---|---|---|---|
| CloudFront (prefix list) | B nginx | 80 | Only public entry point (unchanged) |
| B nginx | A payment-gateway | 8080 | `/api/v1/payments`, `/ops`, `/merchants` |
| B nginx | C llm-insights | 8001 | `/api/v1/insights`, `/llm` |
| A payment-gateway | B risk-engine | 8081 | Synchronous risk assessment |
| B risk-engine | C ml-scorer | 8000 | Synchronous ML score (timeout → rules-only, `degraded`) |
| C llm-insights | B risk-engine | 8081 | Assessment details for the prompt |
| A payment-gateway; C llm-insights, ml-feedback | B PostgreSQL | 5432 | Each service logs in to its own database with its own user |
| B risk-engine; C llm-insights, ml-feedback | A Kafka | 9092 | Events (gateway on A uses it locally) |

**Peering is verified first (RISK-166).** The Free plan's managed SCPs and RCPs may block cross-account peering or cross-account ECR pulls. If peering is not possible, the fallback is:

- an Elastic IP on A and C;
- security groups admitting only the peer Elastic IPs;
- mandatory TLS for PostgreSQL;
- `SASL_SSL` for Kafka;
- TLS between services.

The fallback costs about USD 3.6/month per extra Elastic IP plus intra-Region transfer charges. It is designed in RISK-166 only if needed.

### Delivery

- **Images:** built and scanned once and stored in Jiawei's ECR. Repository policies let the A and C accounts pull only their own repositories. Same-Region pulls are free. Account IDs live in private `terraform.tfvars`, never in Git.
- **Deployment:** one `deploy-staging.yml`, behind the same `staging` environment approval. For each service it assumes the GitHub OIDC role in that service's account. Each teammate creates a role in their own account that trusts only this repository's `staging` environment and can only deploy their own ECS cluster. Role ARNs are GitHub environment variables.
- **Each account has:** its own Terraform root and state bucket (`infra/terraform/envs/staging-gateway`, `.../staging-ml`, built from the shared modules); AWS Budgets alerts; an EventBridge schedule with the same cron; an ECS cluster; and 7-day CloudWatch log groups.
- **LLM:** Amazon Bedrock is called from host C with an ECS **task role**, with no API key. The role allows `bedrock:InvokeModel` only on the chosen inference profile and its foundation models. Bedrock usage bills Zheng's account.

## Consequences

**Easier**

- The full stack fits on the Free plan, and nobody has to make the irreversible upgrade yet.
- Cost is spread over three credits.
- The ML or LLM containers running out of memory cannot take down payments.
- Each teammate operates a real host. That gives them Terraform, ECS, IAM and on-call experience.
- Separate accounts with peering and least-privilege roles is a realistic multi-account pattern. ADR-0007's migration path still applies per service.

**Harder, accepted**

- **No high availability, and more parts.** If A or B is down, payments stop. If C is down, assessments run rules-only (`degraded`) and insights pause. All three hosts must be up for a demo.
- **Cross-account work.** Three states, three OIDC roles and three schedules. Two credentials (the `gateway` and `llm` database users) have to reach a second account. They are generated in the owning account's SSM and handed over through a password manager's one-time share, never GitHub, chat or email.
- **Unencrypted traffic inside the private network.** Traffic between hosts is plain HTTP, Kafka `PLAINTEXT` and PostgreSQL without TLS. It is confined to peered VPCs and `/32` security-group rules. The threat model records it as T19, accepted for staging.
- **Start order.** Container dependencies cannot span hosts. Services retry their connections at start-up, and ECS restarts a task that exits. The target stays "usable ≤ 5 minutes after the scheduled start".
- **Dependence on teammates' accounts.** If a teammate's account becomes unavailable, their host is rebuilt from Terraform in another account. PostgreSQL data lives on B; Kafka's outbox source of truth is the producers' databases.

**Follow-ups:** RISK-165 (shared modules and changes to B), RISK-166 (peering and ECR spike), RISK-167 (multi-account pipeline and wake/sleep/status), RISK-168 (host A, Jiajun), RISK-169 (host C, Zheng) and RISK-170 (PostgreSQL on B).

**Revisit** if the spike fails and the fallback proves too costly, when any account leaves the Free plan, or at M5. Upgrading one account to the Paid plan and consolidating onto a `t4g.medium` is then a supported way back. The `ecs-service` definitions do not change.
