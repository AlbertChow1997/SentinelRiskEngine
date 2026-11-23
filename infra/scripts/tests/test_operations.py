"""Exercise confirmation/host selection using a fake CLI; never contact AWS."""
import os
from pathlib import Path
import subprocess
import tempfile
import unittest

SCRIPTS = Path(__file__).resolve().parents[1]


class OperationsTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        directory = Path(self.temp.name)
        self.log = directory / "calls"
        fake = directory / "aws"
        fake.write_text('''#!/usr/bin/env python3
import os, sys
from pathlib import Path
args=sys.argv[1:]
with Path(os.environ['CALLS']).open('a') as f: f.write(' '.join(args)+'\\n')
if args[:2]==['ec2','describe-instances']:
    print(os.environ.get('HOSTS','i-test') if '--filters' in args else 'stopped')
elif args[:2]==['ecs','list-container-instances']: print('container-test')
elif args[:2]==['ecs','describe-container-instances']: print('True')
elif args[:2]==['ecs','list-services']: print('service-test')
''')
        fake.chmod(0o755)
        self.env = dict(os.environ, PATH=str(directory)+os.pathsep+os.environ["PATH"], CALLS=str(self.log))

    def run_script(self, name, answer=""):
        return subprocess.run(["bash", str(SCRIPTS/name)], input=answer, text=True, capture_output=True, env=self.env)

    def test_cancel_and_eof_never_mutate(self):
        for name in ["aws-wake.sh", "aws-sleep.sh"]:
            for answer in ["no\n", ""]:
                self.assertNotEqual(self.run_script(name, answer).returncode, 0)
        self.assertNotIn("start-instances", self.log.read_text())
        self.assertNotIn("stop-instances", self.log.read_text())

    def test_ambiguous_host_refused(self):
        self.env["HOSTS"] = "i-one i-two"
        result = self.run_script("aws-wake.sh", "start\n")
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("exactly one", result.stderr)
        self.assertNotIn("start-instances", self.log.read_text())

    def test_confirmed_start_waits_for_agent_and_services(self):
        result = self.run_script("aws-wake.sh", "start\n")
        self.assertEqual(result.returncode, 0, result.stderr)
        calls = self.log.read_text()
        self.assertIn("ec2 start-instances", calls)
        self.assertIn("ecs wait services-stable", calls)

    def test_confirmed_stop(self):
        result = self.run_script("aws-sleep.sh", "stop\n")
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("ec2 stop-instances", self.log.read_text())

    def test_status_never_mutates(self):
        self.assertEqual(self.run_script("aws-status.sh").returncode, 0)
        self.assertNotIn("start-instances", self.log.read_text())
        self.assertNotIn("stop-instances", self.log.read_text())


if __name__ == "__main__":
    unittest.main()
