"""Integration-test publish/deploy ordering and fail-closed lookup with fake tools."""
import gzip
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest

SCRIPTS = Path(__file__).resolve().parents[1]


class DeployFlowTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        shutil.copytree(SCRIPTS, self.root/"infra/scripts", ignore=shutil.ignore_patterns("tests", "__pycache__"))
        tools = self.root/"tools"
        tools.mkdir()
        self.log = self.root/"calls"
        stub = f"#!{sys.executable}\n"+'''import json, os, sys
from pathlib import Path
tool=Path(sys.argv[0]).name
args=sys.argv[1:]
with Path(os.environ['CALLS']).open('a') as f: f.write(tool+' '+' '.join(args)+'\\n')
if tool=='python3':
    if args[0].endswith('smoke_staging.py'): sys.exit(0)
    os.execv(sys.executable,[sys.executable]+args)
if tool=='docker':
    if args[0] in ['load','login']: sys.stdin.buffer.read()
    sys.exit(0)
if args[:2]==['ecr','describe-images']:
    if '--query' in args: print('sha256:synthetic')
    elif os.environ.get('BAD_LOOKUP'):
        print('AccessDeniedException',file=sys.stderr); sys.exit(254)
    elif os.environ.get('EXISTING_IMAGE'): print('{}')
    else:
        print('ImageNotFoundException',file=sys.stderr); sys.exit(254)
elif args[:2]==['ecr','get-login-password']: print('synthetic-login')
elif args[:2]==['ec2','describe-instances']: print('i-test' if '--filters' in args else 'stopped')
elif args[:2]==['ecs','list-container-instances']: print('container-test')
elif args[:2]==['ecs','describe-container-instances']: print('True')
elif args[:2]==['ecs','list-services']: print('service-test')
elif args[:2]==['ecs','describe-task-definition']:
    name=args[args.index('--task-definition')+1]
    print(json.dumps({'taskDefinition':{'family':name,'runtimePlatform':{'cpuArchitecture':'ARM64'},'containerDefinitions':[{'name':name,'image':'unpublished','healthCheck':{'command':['CMD','true']}}]}}))
elif args[:2]==['ecs','register-task-definition']: print('task-test')
elif args[:2]==['ecs','describe-services']: print(('old-task' if os.environ.get('ROLLBACK') else 'task-test')+'\\tCOMPLETED')
elif args[:2]==['cloudfront','create-invalidation']: print('invalidation-test')
'''
        for name in ["aws", "docker", "python3"]:
            path = tools/name
            path.write_text(stub)
            path.chmod(0o755)
        artifact = self.root/".staging-artifact"
        (artifact/"frontend").mkdir(parents=True)
        (artifact/"frontend/index.html").write_text("<!doctype html>")
        (artifact/"images.tar.gz").write_bytes(gzip.compress(b"synthetic image archive"))
        self.env = dict(os.environ, PATH=str(tools)+os.pathsep+os.environ["PATH"], CALLS=str(self.log),
                        GITHUB_ACTIONS="true", GITHUB_REF="refs/heads/main", GITHUB_SHA="synthetic-commit",
                        STAGING_ECR_REGISTRY="registry.example.invalid", STAGING_WEBSITE_BUCKET="test-site",
                        STAGING_DISTRIBUTION_ID="test-distribution", STAGING_URL="https://synthetic.cloudfront.net", INFRA_OWNER="test-owner")

    def deploy(self):
        return subprocess.run(["bash", "infra/scripts/deploy-staging.sh"], cwd=self.root, env=self.env, capture_output=True, text=True)

    def test_fresh_publish_then_wake_services_site_and_smoke(self):
        result = self.deploy()
        self.assertEqual(result.returncode, 0, result.stderr)
        calls = self.log.read_text()
        self.assertEqual(calls.count("docker push"), 2)
        self.assertLess(calls.index("docker push"), calls.index("ec2 start-instances"))
        self.assertLess(calls.index("ecs update-service"), calls.index("s3 sync"))
        self.assertLess(calls.index("cloudfront wait invalidation-completed"), calls.index("smoke_staging.py"))
        self.assertNotIn("--delete", calls)
        self.assertNotIn("stop-instances", calls)

    def test_iam_failure_does_not_publish_or_start(self):
        self.env["BAD_LOOKUP"] = "true"
        result = self.deploy()
        self.assertNotEqual(result.returncode, 0)
        calls = self.log.read_text()
        self.assertNotIn("docker push", calls)
        self.assertNotIn("start-instances", calls)

    def test_existing_sha_is_reused_and_scanned(self):
        self.env["EXISTING_IMAGE"] = "true"
        result = self.deploy()
        self.assertEqual(result.returncode, 0, result.stderr)
        calls = self.log.read_text()
        self.assertNotIn("docker push", calls)
        self.assertEqual(calls.count("docker pull"), 2)
        self.assertEqual(calls.count("--scanners vuln"), 2)

    def test_circuit_breaker_rollback_cannot_report_deployment_success(self):
        self.env["ROLLBACK"] = "true"
        result = self.deploy()
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("false success after rollback", result.stderr)
        self.assertNotIn("s3 sync", self.log.read_text())


if __name__ == "__main__":
    unittest.main()
