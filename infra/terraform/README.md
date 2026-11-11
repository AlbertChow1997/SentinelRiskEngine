# Terraform — staging

Nothing in this folder has been written or applied yet. This file records the plan so the first infrastructure PR (RISK-102) has
a fixed starting point.

## Module plan

| Module | Creates | Order |
|---|---|---|
| `network` | VPC, one public subnet, internet gateway, routes, security group (port 80 from the CloudFront prefix list only) | 1 |
| `github-oidc` | GitHub OIDC provider and the deploy role, limited to this repository | 1 |
| `ecr` | One repository per image, scan on push, lifecycle policy (keep last 10) | 1 |
| `ecs-ec2-host` | ECS cluster, the `t4g.medium` instance, instance role, Elastic IP, data volume, user data | 2 |
| `scheduler` | EventBridge Scheduler start/stop schedules (Europe/Dublin) | 2 |
| `ecs-service` | Task definition + service for one component (reused per component) | 2 |
| `cdn` | S3 bucket, CloudFront distribution, Origin Access Control, `/api/*` origin with the secret header | 2 |
| `cognito` | User pool, groups, app client, Hosted UI domain | 3 (M3) |
| `observability` | Log groups, metric filters, alarms, dashboard, backup schedules | 3 (M4) |

AWS Budgets alerts ($15 forecast, $25 actual) are part of the **first** apply.

## Remote state bootstrap (one-off, by hand, after approval)

Terraform keeps its state in S3 so that the pipeline and people share it. The state bucket cannot be created by the
configuration that stores its state in it, so it is created once, by hand or from a tiny separate `bootstrap` configuration
with local state:

1. Choose a globally unique bucket name. Keep the AWS account ID out of Git: pass the name through a git-ignored
   `backend.hcl` (commit a `backend.hcl.example` with placeholders).
2. Create the bucket in `eu-west-1` with versioning, default encryption and all public access blocked.
3. State locking: use S3 native locking if the Terraform CLI version in use supports it, otherwise a DynamoDB lock table.
   **Check the Terraform S3 backend documentation for the version we pin** before choosing.
4. In `envs/staging`, declare an empty `backend "s3" {}` block and run `terraform init -backend-config=backend.hcl`.
5. Record the outcome (bucket naming rule, locking method) in `docs/TECH_DECISIONS.md` D06.

These steps create AWS resources and therefore need explicit approval before they are run.

## Day-to-day

```bash
terraform -chdir=infra/terraform/envs/staging init -backend-config=backend.hcl
terraform -chdir=infra/terraform/envs/staging plan      # always allowed; also posted on PRs by terraform.yml
# terraform apply — only after explicit approval
```
