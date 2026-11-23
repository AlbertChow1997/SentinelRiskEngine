#!/usr/bin/env bash
set -euo pipefail
# The AWS project is locked to eu-north-1 (ADR-0015).
export AWS_REGION=${AWS_REGION:-eu-north-1}
export AWS_PAGER=""
cluster=${SENTINEL_CLUSTER:-sentinel-staging}
schedule_group=${SENTINEL_SCHEDULE_GROUP:-sentinel-staging}
command -v aws >/dev/null || { echo 'AWS CLI v2 and short-term login are required.' >&2; exit 1; }

# Split CLI text output on any whitespace: it can span several lines (one per page or reservation).
words() { tr -s '[:space:]' '\n' <<< "$1" | sed '/^$/d;/^None$/d'; }

# Capture before parsing so a failing call (expired login, AccessDenied) stops the script under set -e.
ids=$(aws ec2 describe-instances --filters Name=tag:project,Values=sentinel-pay Name=tag:env,Values=staging Name=instance-state-name,Values=pending,running,stopping,stopped --query 'Reservations[].Instances[].InstanceId' --output text)
mapfile -t instances < <(words "$ids")
[[ ${#instances[@]} == 1 && ${instances[0]} == i-* ]] || { echo 'Expected exactly one tagged staging host; refusing to act.' >&2; exit 1; }
instance=${instances[0]}

confirm() {
  local answer
  printf 'Type %s to %s staging host %s (changes AWS state/cost): ' "$1" "$1" "$instance"
  read -r answer || { echo 'No confirmation; cancelled.' >&2; exit 1; }
  [[ "$answer" == "$1" ]] || { echo 'Cancelled.' >&2; exit 1; }
}

# Fills the service_arns array (possibly empty).
list_service_arns() {
  local arns
  arns=$(aws ecs list-services --cluster "$cluster" --query 'serviceArns[]' --output text)
  mapfile -t service_arns < <(words "$arns")
}

# describe-services and wait services-stable accept at most 10 services per call.
for_each_service_batch() {
  local i
  for ((i = 0; i < ${#service_arns[@]}; i += 10)); do
    "$@" "${service_arns[@]:i:10}"
  done
}
