# ADR-0011: Terraform staging foundation and S3 native locking

Status: Proposed implementation of accepted D06; review required in RISK-102.
Date: 20 November 2026.

Use Terraform 1.17.2 (pinned in .terraform-version/CI) and AWS provider ~> 6.71.0,
locked with checksums. Versions and resource arguments were checked against
HashiCorp release/provider documentation. Use native S3 locking (`use_lockfile`),
not DynamoDB: locking is a CLI/backend feature, not an AWS-provider capability.

The bootstrap root initially uses local state and creates a private, versioned,
TLS-only, AES256-encrypted S3 state bucket. Retain/protect state from destruction.
Its very first approved apply also creates account-wide $15 forecast/$25 actual
budget notifications. Alerts do not stop spending. Keep bootstrap state backed up
privately; staging uses the bucket and a separate staging/terraform.tfstate key.

Foundation modules implement a public subnet without NAT/ALB, CloudFront-only HTTP
ingress without SSH, six immutable scan-on-push ECR repositories (ten-image
retention), and exact-repository OIDC trust. Separate plan/deploy roles: plan can
read infrastructure/state and mutate only its lockfile; deploy initially only
publishes scoped ECR images. No Terraform apply permission is given to Actions.
An existing GitHub OIDC provider can be reused; inspect the account first.

No literal account IDs, private addresses, billing email or credentials enter
Git. Provider default tags are project=sentinel-pay, owner and env=staging.
Plan comments contain action counts only; state and saved plans are not artifacts.
Forks and repositories without TF_PLAN_ENABLED skip the credentialed plan job;
fmt, validate, mock-plan tests, TFLint and Trivy still run without AWS credentials.

No resource has been provisioned. Enabling billing access, confirming the address,
reviewing costs/plan and explicitly authorising each apply remain operational
prerequisites. Existing D11-D15 cost rows are indicative, not a refreshed quote;
confirm region pricing before creation. Budget does not guarantee a spending cap.

SSE-S3 (AES256) rather than a customer-managed KMS key is deliberate for this
private/versioned portfolio state bucket. Trivy AWS-0132 has a resource-local
exception expiring 31 January 2027; review key management before production.
Outbound traffic is limited to HTTPS for public AWS APIs, pulls and updates.
Their changing public IPs require internet-wide TCP/443 egress in this no-endpoint
design. Trivy AWS-0104 is excepted on this single rule until 31 January 2027;
there is no general scan exclusion, and inbound remains CloudFront-only.

Rollback: revert unapplied configuration through a PR. After apply, do not destroy
the state bucket or data; review a separate recovery plan. Revoking an OIDC role
requires an approved IAM change. Retain budget alerts while resources remain.

References: [S3 backend](https://developer.hashicorp.com/terraform/language/backend/s3),
[Terraform release](https://releases.hashicorp.com/terraform/1.17.2/),
[AWS provider](https://registry.terraform.io/providers/hashicorp/aws/6.71.0/docs),
[GitHub AWS OIDC](https://docs.github.com/en/actions/how-tos/secure-your-work/security-harden-deployments/oidc-in-aws).
