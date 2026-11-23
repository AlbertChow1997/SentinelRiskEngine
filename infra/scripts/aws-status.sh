#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "${BASH_SOURCE[0]}")/aws-common.sh"
aws ec2 describe-instances --instance-ids "$instance" --query 'Reservations[].Instances[].{Instance:InstanceId,State:State.Name}' --output table
list_service_arns
for_each_service_batch aws ecs describe-services --cluster "$cluster" --query 'services[].{Service:serviceName,Desired:desiredCount,Running:runningCount,Pending:pendingCount}' --output table --services
for name in start stop; do
  aws scheduler get-schedule --group-name "$schedule_group" --name "$name" --query '{Name:Name,State:State,Schedule:ScheduleExpression,Timezone:ScheduleExpressionTimezone}' --output table
done
