"""Check real git histories: required checks must not disappear for unrelated PRs."""
from pathlib import Path
import subprocess
import tempfile
import unittest

SCRIPT = Path(__file__).resolve().parents[1] / "backend-changes.sh"


class BackendChangesTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.git("init", "-q")
        self.git("config", "user.email", "fixture@example.invalid")
        self.git("config", "user.name", "CI fixture")
        self.write("backend/pom.xml", "base")
        self.write("contracts/example.yaml", "base")
        self.commit()
        self.base = self.git("rev-parse", "HEAD").strip()

    def git(self, *args):
        return subprocess.check_output(["git", *args], cwd=self.root, text=True, stderr=subprocess.DEVNULL)

    def write(self, path, content):
        target = self.root / path
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(content)

    def commit(self):
        self.git("add", ".")
        self.git("commit", "-qm", "Fixture change")

    def detect(self, base=None):
        return subprocess.check_output(["bash", str(SCRIPT), self.base if base is None else base, "HEAD"], cwd=self.root, text=True).strip()

    def test_unrelated_frontend_and_docs_can_report_no_backend_work(self):
        self.write("frontend/example.ts", "synthetic")
        self.write("docs/example.md", "synthetic")
        self.commit()
        self.assertEqual(self.detect(), "false")

    def test_backend_change_runs_verification(self):
        self.write("backend/pom.xml", "changed")
        self.commit()
        self.assertEqual(self.detect(), "true")

    def test_deleted_contract_runs_verification(self):
        (self.root / "contracts/example.yaml").unlink()
        self.commit()
        self.assertEqual(self.detect(), "true")

    def test_workflow_changes_run_verification(self):
        self.write(".github/workflows/ci-backend.yml", "synthetic")
        self.commit()
        self.assertEqual(self.detect(), "true")

    def test_unknown_or_missing_base_runs_verification(self):
        self.assertEqual(self.detect(""), "true")
        self.assertEqual(self.detect("not-a-commit"), "true")


if __name__ == "__main__":
    unittest.main()
