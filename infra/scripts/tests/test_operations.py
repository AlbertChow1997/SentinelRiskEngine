"""Exercise confirmation, host selection and service batching with a fake CLI; never contact AWS."""
import os
from pathlib import Path
import subprocess
import tempfile
import unittest

SCRIPTS = Path(__file__).resolve().parents[1]

FAKE_AWS = '''#!/usr/bin/env python3
import os, sys
from pathlib import Path
args = sys.argv[1:]
with Path(os.environ["CALLS"]).open("a") as f:
    f.write(" ".join(args) + "\\n")
fail = os.environ.get("FAIL", "")
if fail and " ".join(args).startswith(fail):
    print("An error occurred (ExpiredToken)", file=sys.stderr)
    sys.exit(255)
if args[:2] == ["ec2", "describe-instances"]:
    print(os.environ.get("HOSTS", "i-test") if "--filters" in args else "stopped")
elif args[:2] == ["ecs", "list-container-instances"]:
    print("container-test")
elif args[:2] == ["ecs", "describe-container-instances"]:
    print("True")
elif args[:2] == ["ecs", "list-services"]:
    print(os.environ.get("SERVICES", "service-test"))
'''


class OperationsTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        directory = Path(self.temp.name)
        self.log = directory / "calls"
        self.log.touch()
        fake = directory / "aws"
        fake.write_text(FAKE_AWS)
        fake.chmod(0o755)
        self.env = dict(os.environ, PATH=str(directory) + os.pathsep + os.environ["PATH"], CALLS=str(self.log))

    def run_script(self, name, answer=""):
        return subprocess.run(["bash", str(SCRIPTS / name)], input=answer, text=True, capture_output=True, env=self.env)

    def calls(self):
        return self.log.read_text()

    def test_cancel_and_eof_never_mutate(self):
        for name in ["aws-wake.sh", "aws-sleep.sh"]:
            for answer in ["no\n", ""]:
                self.assertNotEqual(self.run_script(name, answer).returncode, 0)
        self.assertNotIn("start-instances", self.calls())
        self.assertNotIn("stop-instances", self.calls())

    def test_ambiguous_host_refused_on_one_line(self):
        self.env["HOSTS"] = "i-one\ti-two"
        result = self.run_script("aws-wake.sh", "start\n")
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("exactly one", result.stderr)
        self.assertNotIn("start-instances", self.calls())

    def test_ambiguous_host_refused_across_lines(self):
        # Paginated text output prints one line per page; the second host must still be counted.
        self.env["HOSTS"] = "i-one\ni-two"
        result = self.run_script("aws-sleep.sh", "stop\n")
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("exactly one", result.stderr)
        self.assertNotIn("stop-instances", self.calls())

    def test_no_host_refused(self):
        self.env["HOSTS"] = "None"
        result = self.run_script("aws-wake.sh", "start\n")
        self.assertNotEqual(result.returncode, 0)
        self.assertNotIn("start-instances", self.calls())

    def test_failed_lookup_stops_before_any_change(self):
        self.env["FAIL"] = "ec2 describe-instances"
        result = self.run_script("aws-wake.sh", "start\n")
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("ExpiredToken", result.stderr)
        self.assertNotIn("start-instances", self.calls())

    def test_confirmed_start_waits_for_agent_and_services(self):
        result = self.run_script("aws-wake.sh", "start\n")
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("ec2 start-instances", self.calls())
        self.assertIn("ecs wait services-stable --cluster sentinel-staging --services service-test", self.calls())

    def test_failed_service_listing_is_not_reported_as_ready(self):
        self.env["FAIL"] = "ecs list-services"
        result = self.run_script("aws-wake.sh", "start\n")
        self.assertNotEqual(result.returncode, 0)
        self.assertNotIn("ready", result.stdout)

    def test_services_are_waited_on_in_batches_of_ten(self):
        self.env["SERVICES"] = "\n".join(f"svc-{i:02d}" for i in range(12))
        result = self.run_script("aws-wake.sh", "start\n")
        self.assertEqual(result.returncode, 0, result.stderr)
        waits = [line for line in self.calls().splitlines() if line.startswith("ecs wait services-stable")]
        self.assertEqual([len(line.split("--services ")[1].split()) for line in waits], [10, 2])

    def test_no_services_skips_waiting(self):
        self.env["SERVICES"] = "None"
        result = self.run_script("aws-wake.sh", "start\n")
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertNotIn("services-stable", self.calls())

    def test_confirmed_stop(self):
        result = self.run_script("aws-sleep.sh", "stop\n")
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("ec2 stop-instances", self.calls())

    def test_status_never_mutates_and_batches_describe(self):
        self.env["SERVICES"] = "\n".join(f"svc-{i:02d}" for i in range(11))
        self.assertEqual(self.run_script("aws-status.sh").returncode, 0)
        calls = self.calls()
        self.assertNotIn("start-instances", calls)
        self.assertNotIn("stop-instances", calls)
        self.assertEqual(sum(line.startswith("ecs describe-services") for line in calls.splitlines()), 2)


if __name__ == "__main__":
    unittest.main()
