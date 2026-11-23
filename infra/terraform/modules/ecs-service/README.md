# Reusable ECS EC2 service

ARM64/Linux bridge task with static equal container/host port; one essential
container, bounded memory, seven-day awslogs, separate execution and task roles.
Secrets must be full ARNs (validated: IAM cannot use plain parameter names), with
read permission only on those parameters. Logs go to `/ecs/<name>`. For customer-managed KMS keys, add a separately reviewed decrypt grant.
Inputs: name, cluster_arn, image, image_repository_arn, port, memory, environment,
secrets, optional mounts (host_path/container_path/read_only) and health_check. Outputs: service/task/role
references. Supply health_check explicitly: ECS does not automatically monitor an image's Docker HEALTHCHECK.

Initial desired_count=0: no missing placeholder image is pulled before an explicit
deployment. CD subsequently owns count/task revision; Terraform ignores those
two fields. Structural changes to secrets/roles/container shape must be deployed
through a fresh task definition. minHealthy=0/max=100 permits a short outage with
static ports. Circuit breaker rolls back only when a previous healthy deployment
exists; the first deploy still needs operator recovery if it fails.
