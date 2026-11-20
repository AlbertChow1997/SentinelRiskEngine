#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "${BASH_SOURCE[0]}")/aws-common.sh"
aws ec2 describe-instances --instance-ids "$instance" --query 'Reservations[].Instances[].{Instance:InstanceId,State:State.Name}' --output table
services=$(aws ecs list-services --cluster "$cluster" --query 'serviceArns[]' --output text)
if [[ -n "$services" && "$services" != None ]]; then
  read -r -a service_ids <<< "$services"
  aws ecs describe-services --cluster "$cluster" --services "${service_ids[@]}" --query 'services[].{Service:serviceName,Desired:desiredCount,Running:runningCount,Pending:pendingCount}' --output table
fi
for name in start stop; do
  aws scheduler get-schedule --group-name "$schedule_group" --name "$name" --query '{Name:Name,State:State,Schedule:ScheduleExpression,Timezone:ScheduleExpressionTimezone}' --output table
done
