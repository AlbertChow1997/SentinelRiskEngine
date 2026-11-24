# CLAUDE.md — Infrastructure (`infra/`)

Read the root `CLAUDE.md` first (§7 summarises staging; `docs/DESIGN.md` §19 is the specification); this file only adds what is specific to this folder.
Owner: Jiawei Zhou (modules, `envs/staging`, pipeline). Host owners (ADR-0017): Jiajun Xiao for `envs/staging-gateway` (host A),
Zheng Liu for `envs/staging-ml` (host C), each in their own AWS account. Design: `docs/DESIGN.md` §19. Decision records:
`docs/adr/0007-single-host-ecs-staging.md`, amended by `docs/adr/0017-three-account-staging-hosts.md`.

## Hard rules

1. **Never run `terraform apply`, `terraform destroy`, start or stop a host, or create or delete any AWS resource without explicit confirmation from the owner of that account in the current conversation.** `terraform plan`, `validate` and `fmt` are fine. Work only in the account of the person you are helping; changes that affect another account (peering, ECR policies, database users) need that owner's agreement in the PR.
2. **No account IDs, ARNs, keys or secrets in Git.** Use variables, data sources and SSM Parameter Store. `*.tfvars` is git-ignored; commit only `*.tfvars.example` with placeholders.
3. **No long-lived AWS keys.** GitHub Actions assumes a role through OIDC.
4. **AWS Budgets alerts go into the very first apply.**
5. Anything that adds a recurring cost needs a row in `docs/TECH_DECISIONS.md` first.

## Status

RISK-102 provides bootstrap/staging roots, network/ECR/OIDC modules, mock-plan tests and
terraform CI; RISK-106 adds the ECS host, ecs-service and scheduler modules and the
wake/sleep/status scripts. These configurations have not been applied. Pin Terraform using
`.terraform-version`; use `init -backend=false` for credential-free validation.

## Commands

```bash
terraform -chdir=infra/terraform fmt -check -recursive
terraform -chdir=infra/terraform/envs/staging init
terraform -chdir=infra/terraform/envs/staging validate
make tf-plan                 # terraform plan for staging (read-only)
make aws-status              # instance state, ECS service health, next scheduled start/stop
make aws-wake                # asks for confirmation
make aws-sleep               # asks for confirmation
```

## Conventions

- One module per concern, each with `variables.tf`, `outputs.tf`, `main.tf`, `versions.tf` and a short `README.md`.
- Pin the Terraform CLI and the AWS provider with version constraints. **Check the provider documentation for resource arguments; do not rely on memory.**
- Every resource is tagged `project=sentinel-pay`, `owner`, `env=staging` — set `default_tags` on the provider.
- Region `eu-north-1` (the AWS project is locked to it; ADR-0015), set once through the `region` variable, in every account. Subnets are placed by AZ ID `eun1-az1`, never by AZ name. Images and the hosts are **ARM64**.
- Three accounts, three roots, three state buckets (ADR-0017). VPC CIDRs `10.42.0.0/16` (B), `10.43.0.0/16` (A), `10.44.0.0/16` (C); fixed host IPs `10.4x.1.10`. Peer account IDs live only in private `terraform.tfvars`.
- The instance is standalone (no Auto Scaling Group), so stop/start keeps its volumes.
- No SSH and no port 22. Access is through SSM Session Manager.
- Host B's security group admits port 80 only from the CloudFront origin-facing managed prefix list. Every cross-host rule admits one port from the peer host's `/32` (`DESIGN.md` §19.8); hosts A and C take no internet traffic.
- Secrets reach containers as ECS task `secrets` from SSM SecureString parameters.
- CloudWatch log groups keep 7 days. Alarms use `treat_missing_data = notBreaching`.
- Scripts in `scripts/` are POSIX shell with `set -euo pipefail`, and any script that changes state asks for confirmation first.
- Run `terraform fmt` before committing. CI adds `validate`, `tflint` and `checkov` / `trivy config`, and posts the plan on the PR.
