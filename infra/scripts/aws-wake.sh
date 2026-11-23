#!/usr/bin/env bash
set -euo pipefail
case ${1:-} in ''|--agent-only) ;; *) echo 'Usage: aws-wake.sh [--agent-only]' >&2; exit 1;; esac
source "$(dirname "${BASH_SOURCE[0]}")/aws-common.sh"
confirm start
state=$(aws ec2 describe-instances --instance-ids "$instance" --query 'Reservations[0].Instances[0].State.Name' --output text)
if [[ "$state" == stopping ]]; then aws ec2 wait instance-stopped --instance-ids "$instance"; state=stopped; fi
if [[ "$state" == stopped ]]; then aws ec2 start-instances --instance-ids "$instance" >/dev/null; fi
aws ec2 wait instance-running --instance-ids "$instance"
aws ec2 wait instance-status-ok --instance-ids "$instance"
ready=false
for attempt in {1..60}; do
  container=$(aws ecs list-container-instances --cluster "$cluster" --filter "ec2InstanceId == $instance" --query 'containerInstanceArns[0]' --output text)
  if [[ "$container" != None && -n "$container" ]] && [[ $(aws ecs describe-container-instances --cluster "$cluster" --container-instances "$container" --query 'containerInstances[0].agentConnected' --output text) == True ]]; then ready=true; break; fi
  sleep 5
done
[[ "$ready" == true ]] || { echo 'ECS agent did not connect in five minutes.' >&2; exit 1; }
# --agent-only: used by the deployment, which establishes service health itself.
if [[ ${1:-} == --agent-only ]]; then
  echo 'EC2 and ECS agent are ready; deployment will establish service health next.'
  exit 0
fi
list_service_arns
for_each_service_batch aws ecs wait services-stable --cluster "$cluster" --services
echo 'Staging host and configured ECS services are ready; verify the CDN smoke endpoint.'
