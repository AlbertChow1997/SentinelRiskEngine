# Single ARM64 ECS host

Standalone ARM64 Graviton host (`instance_type`; t4g.small on the Free plan, ADR-0016) using the current ECS-optimised AL2023 ARM64 SSM AMI,
SSM/ECS instance role, IMDSv2 (hop limit 1), encrypted 30 GiB root and separately
protected 20 GiB gp3 data disk, EIP and 2 GiB swap. No ASG or SSH key.
Inputs: name, subnet/security-group IDs, the subnet's availability_zone (pass the
network module's output, never a literal) and ami_parameter_name.
Outputs: instance/cluster references, public_ip, data_volume_id, ami_parameter_name.

User data waits for the exact EBS NVMe serial and formats only an unformatted
disk. Mount /data before ECS registration and on subsequent boots. PostgreSQL 18
will mount /data/postgres at /var/lib/postgresql (not the old /data suffix).
No database/Kafka container or backups are deployed by this module.

EIP/storage cost continues while stopped. AMI changes are ignored (no surprise
replacement); roll AMIs with the runbook's `-replace` procedure. User-data changes
still replace the host: take a verified backup and review the plan before approval.
/data is mounted with `nofail` so a missing disk cannot make the host unreachable. Never delete
the protected data disk or force-detach a live filesystem. Live boot, stop/start
and restore checks remain required after an approved apply.
