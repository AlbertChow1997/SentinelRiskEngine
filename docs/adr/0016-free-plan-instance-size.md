# ADR-0016: Run the staging host on t4g.small while the AWS project is on the Free plan

| | |
|---|---|
| **Status** | Accepted; the rejection of option 4 is reversed by [ADR-0017](0017-three-account-staging-hosts.md) |
| **Date** | 23 Nov 2026 |
| **Deciders** | Jiawei Zhou (tech lead, owner of `infra/`) |
| **Related** | RISK-108 (#52) · ADR-0007 · ADR-0015 · `TECH_DECISIONS.md` D12 |
| **Amends** | ADR-0007 (instance size only) |

## Context

The first staging apply on 23 Nov 2026 created 55 of 64 resources. EC2 refused the host:
`InvalidParameterCombination: The specified instance type is not eligible for Free Tier`. The AWS project is on the Free
plan, which only allows Free-Tier-eligible instance types. In eu-north-1 these are:

| Type | Architecture | Memory |
|---|---|---|
| t3.micro / t4g.micro | x86 / ARM64 | 1 GiB |
| t3.small / **t4g.small** | x86 / **ARM64** | 2 GiB |
| c7i-flex.large | x86 | 4 GiB |
| m7i-flex.large | x86 | 8 GiB |

ADR-0007 chose `t4g.medium` (ARM64, 4 GiB) for the full stack (about 3.3 GiB of containers). M0 runs only the Risk
Engine health service (512 MiB limit) and nginx (64 MiB), about 1 GiB with the OS and ECS agent.

## Options

1. **t4g.small now, decide before M1** — stays ARM64 and needs no pipeline change. 2 GiB covers M0, not the full stack.
2. **Upgrade the project to the Paid plan and keep t4g.medium** — matches ADR-0007, but the upgrade cannot be reversed.
3. **x86 c7i-flex.large or m7i-flex.large** — enough memory, but images, task definitions and the ARM runner pipeline are ARM64-only and would all change; roughly 2.5-3x the hourly price.
4. **Split the services across two AWS accounts** (a teammate's) — two 2 GiB hosts. Rejected: synchronous calls and Postgres/Kafka would cross accounts (public exposure or unverified cross-account peering), two Terraform states, OIDC setups and pipelines, and half the system depends on another person's account.

## Decision

Option 1. The host type becomes the Terraform variable `instance_type`, default `t4g.small`. A validation keeps it to
ARM64 Graviton families, because the images are `linux/arm64` only. On-demand price in eu-north-1 is USD 0.0172/h, about
USD 3.6/month on the development window (210 h).

## Consequences

- M0 can deploy on the Free plan today. The data volume, Elastic IP, scheduler and CDN are unchanged.
- **Before M1/M2 adds PostgreSQL and Kafka**, the team must choose between the Paid plan with `t4g.medium` (a one-line
  variable change) and the x86 option. RISK-108 tracks it; the choice goes into a new ADR.
- Changing `instance_type` on an existing host is an in-place stop/modify/start, not a replacement. `/data` stays attached.
- Running more than the M0 containers on 2 GiB risks out-of-memory kills; the 2 GiB swap file is a safety net, not capacity.
