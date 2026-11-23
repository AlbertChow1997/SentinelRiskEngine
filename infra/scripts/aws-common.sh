#!/usr/bin/env bash
set -euo pipefail
export AWS_REGION=${AWS_REGION:-eu-west-1}
export AWS_PAGER=""
cluster=${SENTINEL_CLUSTER:-sentinel-staging}
schedule_group=${SENTINEL_SCHEDULE_GROUP:-sentinel-staging}
command -v aws >/dev/null || { echo 'AWS CLI v2 and short-term login are required.' >&2; exit 1; }
ids=$(aws ec2 describe-instances --filters Name=tag:project,Values=sentinel-pay Name=tag:env,Values=staging Name=instance-state-name,Values=pending,running,stopping,stopped --query 'Reservations[].Instances[].InstanceId' --output text)
read -r -a instances <<< "$ids"
[[ ${#instances[@]} == 1 && ${instances[0]} == i-* ]] || { echo 'Expected exactly one tagged staging host; refusing to act.' >&2; exit 1; }
instance=${instances[0]}
confirm() {
  local answer
  printf 'Type %s to %s staging host %s (changes AWS state/cost): ' "$1" "$1" "$instance"
  read -r answer || { echo 'No confirmation; cancelled.' >&2; exit 1; }
  [[ "$answer" == "$1" ]] || { echo 'Cancelled.' >&2; exit 1; }
}
