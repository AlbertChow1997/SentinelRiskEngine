# Terraform staging

RISK-102 implements bootstrap, network, ECR and GitHub OIDC. AWS bootstrap/apply
and a live plan still require account configuration/approval. Pin Terraform
1.17.2 and AWS provider ~> 6.71.0 with committed provider lockfiles; ADR-0011.

| Root/module | Responsibility |
|---|---|
| bootstrap | Private/versioned/TLS-only state bucket; $15 forecast/$25 actual budget alerts in the very first apply |
| envs/staging | Remote-state root; `region` variable (default eu-north-1); default project/owner/env tags |
| network | One public subnet; no NAT/ALB/SSH; HTTP only from CloudFront prefix list |
| ecr | Six immutable encrypted scan-on-push repositories; ten-image retention |
| github-oidc | Exact repo subjects; separate plan and deployment roles; optional existing provider |

## Validate without AWS

```bash
terraform -chdir=infra/terraform fmt -check -recursive
terraform -chdir=infra/terraform/bootstrap init -backend=false
terraform -chdir=infra/terraform/bootstrap validate
terraform -chdir=infra/terraform/bootstrap test
terraform -chdir=infra/terraform/envs/staging init -backend=false
terraform -chdir=infra/terraform/envs/staging validate
terraform -chdir=infra/terraform/envs/staging test
```

Tests use mock providers and plan only: they create no AWS resources and cannot
prove live IAM, quotas, DNS or deployment health. CI adds TFLint and Trivy.

## Bootstrap, only after approval

1. Check billing access/notification address, eu-north-1 quota and current pricing.
   Inspect for an existing GitHub OIDC provider; supply its reference privately.
2. Copy bootstrap example variables to ignored terraform.tfvars. Plan, review
   costs and get explicit approval before applying a saved plan. Alerts are not
   a spending cap. Back up bootstrap state privately; never commit state/email.
3. Copy staging backend.hcl.example and terraform.tfvars.example to their ignored
   counterparts. Never commit account identifiers, state or saved plans.
4. Run staging init -backend-config=backend.hcl. Native S3 locking uses
   use_lockfile=true; there is no DynamoDB table. D06 records the choice.
5. Review staging plan and obtain separate approval for that apply.

## GitHub setup after approved bootstrap

Set TF_STATE_BUCKET, INFRA_OWNER, TF_PLAN_ROLE_ARN and, only when ready,
TF_PLAN_ENABLED=true as repository variables. The plan role cannot apply.
Fork PRs never receive AWS credentials. PR comments contain counts only; no
resource identifiers, secrets or plan JSON. Bootstrap cannot use the role/bucket
before creating them: its plan stays a private local operation. Review code
before enabling credentialed plans. Never grant Actions administrator access.

Deploy trust uses environment:staging. Verify its main-only restriction and real
reviewer gate before enabling deployment (RISK-101/Q21 entitlement blocker).
ECS/scheduler, CDN/nginx and deployment follow as RISK-103/104/105.
