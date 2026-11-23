# Operations scripts

Bash scripts use set -euo pipefail (Bash is required; strict POSIX sh lacks
pipefail/arrays). AWS CLI v2 and a short-term login are prerequisites.

| Script | Make target | Behaviour |
|---|---|---|
| aws-wake.sh | aws-wake | Require start confirmation; wait for EC2/ECS agent/services |
| aws-sleep.sh | aws-sleep | Require stop confirmation; wait for stopped state |
| aws-status.sh | aws-status | Read-only host/service/schedule state and configured cron/timezone |

Host selection uses project/env tags and refuses zero or multiple matches. There
is no --yes switch. Region defaults to eu-north-1. AWS errors (expired login,
AccessDenied) stop the script before any change. ECS calls go in batches of ten. Override cluster/group using
SENTINEL_CLUSTER/SENTINEL_SCHEDULE_GROUP. Tests inject a fake AWS CLI and never
contact AWS. See docs/runbooks/staging-platform.md for boot/data/recovery limits.

RISK-105 adds deploy-staging.sh (approved GitHub workflow only), environment-gate
verification, task-definition rendering and public smoke helpers. Fake CLI tests
cover fresh/reused SHA deployment order and IAM lookup failure. The --agent-only
wake option skips old service stability during CD, never confirmation. See
docs/runbooks/staging-deployment.md; no live deployment has been performed.
