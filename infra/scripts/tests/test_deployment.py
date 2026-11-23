import sys
from pathlib import Path
import unittest
from unittest.mock import patch
import io
import json

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from deployment_gate import verify
from render_task_definition import render
from smoke_staging import check


class DeploymentTests(unittest.TestCase):
    def test_gate_requires_reviewer_self_review_prevention_and_exact_main(self):
        env = {"protection_rules": [{"type": "required_reviewers", "reviewers": ["synthetic-reviewer"], "prevent_self_review": True}],
               "deployment_branch_policy": {"custom_branch_policies": True}}
        branches = {"branch_policies": [{"name": "main", "type": "branch"}]}
        verify(env, branches)
        for bad in [{}, {**env, "protection_rules": []},
                    {**env, "protection_rules": [{"type": "required_reviewers", "reviewers": ["synthetic-reviewer"]}]}]:
            with self.assertRaises(ValueError):
                verify(bad, branches)
        for policy in [{}, {"branch_policies": [{"name": "*"}]}, {"branch_policies": [{"name": "main", "type": "tag"}]}]:
            with self.assertRaises(ValueError):
                verify(env, policy)

    def test_render_preserves_security_and_strips_response_metadata(self):
        source = {"taskDefinition": {"family": "test", "revision": 9, "taskDefinitionArn": "response-only",
                  "runtimePlatform": {"cpuArchitecture": "ARM64", "operatingSystemFamily": "LINUX"},
                  "containerDefinitions": [{"name": "risk", "image": "old", "secrets": [{"name": "test", "valueFrom": "parameter-reference"}],
                                            "healthCheck": {"command": ["CMD", "true"]}}]}}
        result = render(source, "risk", "example.invalid/risk@sha256:synthetic")
        self.assertNotIn("revision", result)
        self.assertNotIn("taskDefinitionArn", result)
        self.assertEqual(result["containerDefinitions"][0]["image"], "example.invalid/risk@sha256:synthetic")
        self.assertEqual(result["containerDefinitions"][0]["secrets"], source["taskDefinition"]["containerDefinitions"][0]["secrets"])
        self.assertEqual(source["taskDefinition"]["containerDefinitions"][0]["image"], "old")
        with self.assertRaises(ValueError):
            render(source, "missing", "new")

    @patch("smoke_staging.urlopen")
    def test_smoke_checks_html_and_up_json(self, fetch):
        class Response(io.BytesIO):
            status = 200
        fetch.side_effect = [Response(b"<!doctype html><html>synthetic</html>"), Response(json.dumps({"status": "UP"}).encode())]
        check("https://synthetic.cloudfront.net")
        with self.assertRaises(ValueError):
            check("http://example.invalid")


if __name__ == "__main__":
    unittest.main()
