"""Fail closed when a real staging reviewer/main-only gate is absent."""
import json
from pathlib import Path
import sys


def verify(environment, policies):
    rules = environment.get("protection_rules", [])
    if not any(rule.get("type") == "required_reviewers" and rule.get("reviewers")
               and rule.get("prevent_self_review") is True for rule in rules):
        raise ValueError("staging requires a nonempty required-reviewer rule with self-review prohibited")
    policy = environment.get("deployment_branch_policy") or {}
    branches = policies.get("branch_policies", [])
    if not policy.get("custom_branch_policies") or not branches or any(
        item.get("name") != "main" or item.get("type", "branch") != "branch"
        for item in branches
    ):
        raise ValueError("staging must permit only the exact main branch, with no tag/wildcard policies")


if __name__ == "__main__":
    try:
        verify(*(json.loads(Path(path).read_text()) for path in sys.argv[1:3]))
    except (ValueError, OSError) as error:
        sys.exit(str(error))
    print("Verified staging reviewer and main-only deployment gate.")
