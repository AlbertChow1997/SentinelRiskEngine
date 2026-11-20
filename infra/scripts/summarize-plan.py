"""Publish only action counts; never print state, resource IDs or sensitive values."""
import collections
import json
import sys

plan = json.load(sys.stdin)
counts = collections.Counter(
    "/".join(change["change"]["actions"])
    for change in plan.get("resource_changes", [])
)
print("Terraform staging plan (read-only; apply requires separate approval).\n")
print("| Actions | Resources |\n|---|---:|")
for actions, count in sorted(counts.items()):
    print(f"| {actions} | {count} |")
print("\nFull saved plans remain private on the runner and are not uploaded.")
