# GitHub OIDC

Creates/reuses one account-wide GitHub OIDC provider. Pass existing_provider_arn
if one already exists (never create a duplicate). Exact audience and repository
subjects separate PR plan access from environment:staging deployment access.
Plan can read infrastructure/state and write only the S3 lockfile. Deploy can
publish only the supplied ECR repositories; it cannot apply Terraform. Later
infrastructure PRs add scoped deployment operations. No administrator policy.

Inputs: name, repository, state_bucket_name, ECR ARNs and optional existing provider.
Outputs: plan_role_arn, deploy_role_arn (configure as GitHub variables, never copy
literal account identifiers into Git). Trusting environment:staging requires the
environment to restrict deployments to main and to have an actual reviewer gate;
RISK-101's entitlement blocker is not solved by this trust policy.
