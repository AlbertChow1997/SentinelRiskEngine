# Staging deployment (prepared, disabled)

RISK-105 implements a manual pipeline for M0's existing risk-engine health
service, nginx and frontend shell. Gateway/ML/LLM/database workloads are not
invented or deployed. No AWS deployment has occurred. Required reviewer support
is currently unavailable on this private repository's plan (Q21).

## Enable only after prerequisites are real

1. Review and merge infrastructure dependencies in order: RISK-102, 103, 104,
   then 105. Backend CI RISK-12 and contract RISK-100 remain separate reviews.
2. Configure short-term AWS login and private bootstrap/staging inputs. Review
   current pricing, billing alerts, Terraform plans and data safety. Each apply
   needs explicit approval; Actions never applies Terraform.
3. Privately create the URL-safe 32-128 character SSM SecureString at
   /sentinel/staging/origin-secret after approval. Protect remote state containing
   its decrypted CloudFront header. Verify /data/docker0/SSM access on the host.
4. Resolve the GitHub plan limitation or approve a separately designed/reviewed
   equivalent gate. The current pipeline requires an actual staging required-
   reviewer rule, prevent_self_review=true and only the exact main branch policy.
   A workflow input, comment, empty environment or team convention is insufficient.
5. Only after verifying that gate, set staging_deploy_gate_verified=true privately
   and review/approve the corresponding Terraform plan/apply. Default false creates
   no deploy role or deployment policy. The role cannot apply Terraform or stop
   hosts; PassRole is restricted to these two ECS services' execution/task roles.
6. Set repository variables from private Terraform outputs: INFRA_OWNER,
   STAGING_DEPLOY_ROLE_ARN, STAGING_ECR_REGISTRY, STAGING_WEBSITE_BUCKET,
   STAGING_DISTRIBUTION_ID, STAGING_URL. Finally set STAGING_DEPLOY_ENABLED=true.
   Never commit real identifiers, state, credentials or variable values.

## One deployment

Choose deploy-staging on main and type DEPLOY_STAGING. This publishes AWS content
and may start EC2, incurring costs. Preflight fails before AWS access unless
explicit intent, enablement and the real environment controls are present.

On a native ARM64 GitHub runner, prepare checks/builds the frontend, builds the
backend (Dockerfile runs Maven verify) and nginx, and scans both images with pinned
Trivy. The gate blocks fixable HIGH/CRITICAL vulnerabilities (`--ignore-unfixed`);
it does not claim that images contain no unfixed vulnerabilities. Verified image
archives/frontend build are retained as an artifact for one day; no credentials
are inside. Avoid unnecessary runs/storage beyond the account's included quota.

A non-self reviewer approves these artifacts before deploy receives OIDC AWS
credentials. If the tech lead is the only reviewer, another authorised teammate
must request the run so the tech lead can approve it. Do not bypass environment
protection as an administrator. A role ARN/typed confirmation is not a substitute
for this gate.

Deployment publishes immutable git-SHA ECR tags and uses resolved digests in task
definitions. On rerun, an existing SHA is pulled/scanned and reused; it is never
overwritten. IAM/network lookup errors fail instead of being treated as missing
images. Wake requires the same confirmation mechanism, waits for EC2 and the ECS
agent, then replaces risk-engine and nginx sequentially and waits for stability.
It also verifies the PRIMARY revision and COMPLETED rollout state: a stable
service after circuit-breaker rollback must fail the new deployment, not report
an old healthy revision as success.
The --agent-only wake option avoids waiting for an unhealthy old deployment
before replacing it; it never bypasses the start confirmation.

Frontend upload preserves old assets for open pages/rollback, writes index last,
invalidates CloudFront and checks public HTML plus /api/health status=UP.
Deploys are serialised and never cancelled in progress by a newer run. The host
stays running until its next scheduled stop, including after a deployment error.
There is no automatic stop, Terraform apply or destructive cleanup.

## Failure and rollback

Before the first successful ECS revision, circuit-breaker rollback has nothing to
restore. Inspect service events/exited tasks privately; correct or redeploy a
known-good image through the same approval flow. Subsequent failed deployments
can use ECS's previous completed revision. Smoke failure does not prove automatic
rollback of the frontend and both services; inspect each one separately.

Choose an earlier reviewed commit on main for rollback only through a separately
reviewed recovery procedure; never allow deployment from an arbitrary branch/tag
to bypass the main-only gate. Restore a retained S3 object version/index and
previous task digest after approval. Keep referenced ECR images within the
ten-image retention window. Old static assets are deliberately retained; review
storage and remove unneeded assets only with an approved cleanup plan.

Live IAM, ECR publication, EC2 wake, ECS rollback, S3/CloudFront and end-to-end
smoke are still unverified. Mock CLI tests exercise sequencing and failures;
they are not a real AWS deployment.
