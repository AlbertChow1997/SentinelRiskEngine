# Staging platform runbook

Status: configuration and local mock validation only. No AWS resource or live
endpoint exists yet. RISK-102/103/104/105 must be reviewed and each apply/deploy
explicitly approved. One eu-west-1 ARM64 ECS host; no SSH, NAT, ALB or HA.

## Prerequisites and first deployment

Follow infra/terraform/README.md for private variables, short-term AWS login,
state bootstrap and first-apply budget alerts. Review actual pricing and quota.
The $15 forecast/$25 actual alerts are notifications, not a spending cap.
Protect bootstrap state and the separately retained encrypted data volume.

Apply only a reviewed saved plan after approval. Verify SSM access, IMDSv2,
/data mount and swap before starting services. Services initially have desired
count zero and unpublished image placeholders. The approved deployment pipeline
will supply real SHA images, task revisions and desired count one.

## Inspect, wake and sleep

Install AWS CLI v2 and Bash; use SSO/short-term login. `make aws-status` is
read-only. Host discovery requires exactly one instance tagged project=sentinel-pay
and env=staging; zero or multiple matches refuse to act. Override region/cluster
only through AWS_REGION/SENTINEL_CLUSTER, never hard-code identifiers.

`make aws-wake` requires typing `start`, starts a stopped host, waits for EC2
status checks, ECS agent connection and service stability. `make aws-sleep`
requires typing `stop`, then waits for the host to stop. Cancellation/EOF never
starts/stops it. There is no unattended --yes mode. Status reports configured
Scheduler expressions/timezone; it does not claim to calculate the next instant.

Default schedule: weekdays 09:00–23:00 Europe/Dublin, including DST. Inspect both
schedules and their enabled state. Manual wake leaves the host running until the
next scheduled stop; remember the extra cost outside the default window.

Stopping compute retains EBS/EIP. EIP, storage, images and CDN can remain billed.
The static frontend remains available; API downtime is expected outside hours.

## Boot/data safety

User data resolves the particular EBS volume via its NVMe serial, waits for
attachment, formats only a disk with no filesystem signature, mounts it by UUID,
and blocks ECS when /data is missing. Subsequent boots require /data before ECS.
It sets up a protected 2 GiB swap file; it starts ECS non-blocking to avoid the
cloud-final dependency deadlock. Session Manager is the administration path.

Inspect `cloud-init status --long`, systemd ECS status, `findmnt /data`, `swapon
--show` and ECS agent logs through SSM. Never format a recovered data disk, force
detach a mounted volume or remove Terraform's prevent_destroy casually.
PostgreSQL 18's future mount is /data/postgres → /var/lib/postgresql. This M0
configuration does not yet run PostgreSQL/Kafka or implement backup jobs.

## Deployment and recovery

Bridge/static host ports use minimumHealthy=0/maximum=100; expect a short outage.
ECS task definitions explicitly supply health checks; do not assume an image's
Docker HEALTHCHECK is automatically monitored by ECS. Deployment circuit breaker
can revert to a prior completed revision; first deployment has none to restore.
CD owns desired count and image/task revision after initial provisioning.

On failure, inspect service events, task exit reason and seven-day CloudWatch
logs. Never print secret environment values. Restore the last known-good SHA
revision through a separately approved deployment. AMI/user-data replacement
needs a tested data backup and reviewed attachment/boot plan. Backup/restore and
five-minute wake targets still require live validation after approval.

## Required live acceptance evidence (not yet performed)

- Budget recipients and notification settings verified; state version/lock tested.
- Host registers in ECS; /data and swap survive stop/start; SSM works without SSH.
- Only CloudFront can enter port 80; other service ports cannot be reached publicly.
- ARM64 task reaches healthy status; failed deployment rollback verified.
- Scheduler start/stop at Dublin local time tested with an approved temporary window.
- RISK-104 CDN secret rejection and RISK-105 end-to-end smoke verified separately.
