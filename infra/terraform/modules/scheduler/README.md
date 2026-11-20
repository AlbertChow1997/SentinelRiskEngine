# Weekday scheduling

EventBridge Scheduler invokes only EC2 StartInstances/StopInstances for the supplied
instance. Defaults: Mon-Fri 09:00/23:00, Europe/Dublin (DST handled by Scheduler).
Inputs: name, instance_id/arn, start_cron, stop_cron, enabled. Output: group_name.
Trust is restricted to the schedule group; execution role cannot control any
other instance. Short bounded retries avoid carrying a stale start into another
window. No schedule is active until an approved Terraform apply creates it.
This stops compute only: EIP, EBS, CDN and stored images can still incur charges.
