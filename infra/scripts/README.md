# Operations scripts

Planned for the first infrastructure PRs (RISK-103). Each script is POSIX shell with `set -euo pipefail`.

| Script | Make target | Does | Changes AWS state? |
|---|---|---|---|
| `aws-wake.sh` | `make aws-wake` | Starts the EC2 host and waits until every ECS service is steady | Yes — asks for confirmation |
| `aws-sleep.sh` | `make aws-sleep` | Stops the EC2 host | Yes — asks for confirmation |
| `aws-status.sh` | `make aws-status` | Shows instance state, ECS service health and the next scheduled start/stop | No |

The instance is found by its tags, never by a hard-coded ID.
