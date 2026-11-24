# Infrastructure (`infra/`)

Terraform for the one AWS environment, **staging** (eu-north-1, ADR-0015), plus the scripts that start, stop and inspect it.

| | |
|---|---|
| **Owner** | Jiawei Zhou (@AlbertChow1997) |
| **Design** | `docs/DESIGN.md` §19 · `docs/adr/0007-single-host-ecs-staging.md` · `docs/adr/0017-three-account-staging-hosts.md` (three hosts in three accounts) |
| **Status** | Layout only. No Terraform code and **no AWS resources exist yet** — first tickets RISK-102 … RISK-105 (milestone M0) |

```text
infra/
├── terraform/
│   ├── modules/          # network, ecs-ec2-host, ecs-service, ecr, cdn, cognito, scheduler, observability, github-oidc
│   └── envs/staging/     # the root module that wires the modules together
└── scripts/              # aws-wake.sh, aws-sleep.sh, aws-status.sh
```

See [`terraform/README.md`](terraform/README.md) for the remote-state bootstrap and the module plan.
Working conventions for this folder are in [`CLAUDE.md`](CLAUDE.md).

> **Nothing here is applied without explicit approval.** `terraform plan` is always fine; `terraform apply`, starting or
> stopping the instance and creating AWS resources need the tech lead's confirmation each time.
