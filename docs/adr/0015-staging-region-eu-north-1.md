# ADR-0015: Run staging in eu-north-1, the AWS project's locked Region

| | |
|---|---|
| **Status** | Accepted |
| **Date** | 23 Nov 2026 |
| **Deciders** | Jiawei Zhou (tech lead, owner of `infra/`) |
| **Related** | RISK-107 (#49) · RISK-108 (#52) · ADR-0007 · ADR-0011 · `TECH_DECISIONS.md` D18 |
| **Amends** | ADR-0007 (Region only; the single-host design is unchanged) |

## Context

ADR-0007 and every design document placed staging in eu-west-1 (Ireland). The team's AWS account was created through
the *new AWS experience* (social sign-in with a "project"). In that experience:

- a project is assigned **one Region from its contact address**, and resources cannot be created in any other Region;
- the assigned Region for this project is **eu-north-1 (Stockholm)**;
- the Region does not change if the contact details change later.

So nothing could ever be created in eu-west-1 from this project. The Terraform on `main` hard-coded eu-west-1 in five
places.

Read-only checks on 23 Nov 2026 also showed these facts:

| Item | Finding |
|---|---|
| Plan | Free plan, USD 100 credit. An upgrade to the Paid plan is required when credits run out or after six months; it cannot be reversed |
| EC2 | `t4g.small`, `t4g.medium` and `t4g.large` are offered in eu-north-1 |
| Price (AWS Price List API) | `t4g.medium` on-demand USD 0.0344/h in eu-north-1 vs USD 0.0368/h in eu-west-1; gp3 USD 0.0836 vs 0.0880 per GB-month |
| Bedrock | Claude models in eu-north-1 are invocable only through `eu.*` or `global.*` **cross-Region inference profiles** |
| Free-plan service list | ECS, ECR, EBS, S3, CloudFront, Cognito, Bedrock, Systems Manager, EventBridge, CloudWatch, Budgets, IAM, CloudFormation and VPC are listed. Data Lifecycle Manager is not. "Multi-Region or cross-Region features are not supported for any services." WAF with CloudFront is not available |
| Not available in eu-north-1 for projects | Amazon Rekognition, Textract, Personalize, App Runner (none are used) |

## Options

1. **Move staging to eu-north-1** — works with the existing project; slightly cheaper; adds latency for Irish users that is irrelevant for a demo.
2. **Create a second AWS account through "Sign up for AWS (advanced)" in eu-west-1** — keeps the design unchanged, but needs a new account, payment details from day one, and gives up the project's credit.
3. **Activate advanced AWS features on this project** — removes the project constraints, but is not needed for Region choice alone and changes the billing and IAM model.

## Decision

Option 1. Staging runs in **eu-north-1**. Terraform takes the Region from one variable, `region`, defaulting to
`eu-north-1`; the availability zone is `${region}a`. The GitHub Actions plan job and the state backend use the same Region.

The EventBridge Scheduler time zone stays `Europe/Dublin`: it follows the team's working hours, not the data centre.

## Consequences

- No resources exist yet, so there is nothing to migrate.
- Indicative cost is unchanged at roughly USD 20-28 a month (slightly lower compute and storage prices).
- The USD 100 credit covers about four months at that rate. The irreversible upgrade decision and its date belong in
  ROADMAP risks (RISK-108).
- **Bedrock access is unconfirmed.** If the Free plan blocks cross-Region inference profiles, `llm-insights` cannot reach
  a Claude model from this project. RISK-108 runs one approved minimal call and records the outcome before M4.
- **Daily EBS snapshots through Data Lifecycle Manager may be unavailable.** RISK-108 decides the backup design
  (for example scheduled `pg_dump` to S3 only, or EventBridge Scheduler calling `CreateSnapshot`).
- WAF stays deferred (already the case in ADR-0007).
- Open PRs and branches that still name eu-west-1 (#31, #32 and the stranded RISK-103 code) are updated when they are
  re-landed on `main` (RISK-106).

**Revisit** if the team moves to an advanced AWS account or the project's Region assignment changes.
