# CLAUDE.md — Infrastructure (`infra/`)

Read the root `CLAUDE.md` first (§7 is the specification); this file only adds what is specific to this folder.
Owner: Jiawei Zhou. Design: `docs/DESIGN.md` §19. Decision record: `docs/adr/0007-single-host-ecs-staging.md`.

## Hard rules

1. **Never run `terraform apply`, `terraform destroy`, start or stop the instance, or create or delete any AWS resource without explicit user confirmation in the current conversation.** `terraform plan`, `validate` and `fmt` are fine.
2. **No account IDs, ARNs, keys or secrets in Git.** Use variables, data sources and SSM Parameter Store. `*.tfvars` is git-ignored; commit only `*.tfvars.example` with placeholders.
3. **No long-lived AWS keys.** GitHub Actions assumes a role through OIDC.
4. **AWS Budgets alerts go into the very first apply.**
5. Anything that adds a recurring cost needs a row in `docs/TECH_DECISIONS.md` first.

## Status

Layout only. Terraform is not installed on every machine yet; `make tf-plan` prints "skipped" until `envs/staging` exists.

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
- Region `eu-west-1`. Images and the instance are **ARM64**.
- The instance is standalone (no Auto Scaling Group), so stop/start keeps its volumes.
- No SSH and no port 22. Access is through SSM Session Manager.
- The security group admits port 80 only from the CloudFront origin-facing managed prefix list.
- Secrets reach containers as ECS task `secrets` from SSM SecureString parameters.
- CloudWatch log groups keep 7 days. Alarms use `treat_missing_data = notBreaching`.
- Scripts in `scripts/` are POSIX shell with `set -euo pipefail`, and any script that changes state asks for confirmation first.
- Run `terraform fmt` before committing. CI adds `validate`, `tflint` and `checkov` / `trivy config`, and posts the plan on the PR.
