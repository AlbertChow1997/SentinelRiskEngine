"""Run inside the nginx test container with Python installed; no AWS required."""
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
import os
import subprocess
import threading
import time
import unittest
from urllib.error import HTTPError
from urllib.request import Request, urlopen

SECRET = "synthetic-origin-secret-0123456789abcdef"


class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        payload = json.dumps({"path": self.path, "port": self.server.server_port,
                              "secret": self.headers.get("X-Sentinel-Origin"),
                              "authorization": self.headers.get("Authorization")}).encode()
        self.send_response(200)
        self.end_headers()
        self.wfile.write(payload)

    def log_message(self, *_):
        pass


class ProxyTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.servers = [ThreadingHTTPServer(("127.0.0.1", port), Handler) for port in [18081, 18080, 18001]]
        for server in cls.servers:
            threading.Thread(target=server.serve_forever, daemon=True).start()
        env = dict(os.environ, ORIGIN_SECRET=SECRET, RISK_UPSTREAM="127.0.0.1:18081", GATEWAY_UPSTREAM="127.0.0.1:18080", LLM_UPSTREAM="127.0.0.1:18001")
        cls.process = subprocess.Popen(["/usr/local/bin/sentinel-entrypoint", "nginx", "-g", "daemon off;"], env=env)
        for _ in range(50):
            try:
                with urlopen("http://127.0.0.1:8080/internal-health") as r:
                    if r.status == 200:
                        return
            except OSError:
                time.sleep(0.1)
        raise RuntimeError("nginx did not start")

    @classmethod
    def tearDownClass(cls):
        cls.process.terminate()
        cls.process.wait(timeout=5)
        for server in cls.servers:
            server.shutdown()
            server.server_close()

    def request(self, path, secret=SECRET):
        headers = {"Authorization": "Bearer synthetic-test-token"}
        if secret is not None:
            headers["X-Sentinel-Origin"] = secret
        return urlopen(Request("http://127.0.0.1:8080"+path, headers=headers))

    def test_missing_and_wrong_header_rejected(self):
        for secret in [None, "wrong"]:
            with self.assertRaises(HTTPError) as error:
                self.request("/api/health", secret)
            self.assertEqual(error.exception.code, 403)
            error.exception.close()

    def test_health_and_service_routes_strip_secret(self):
        for path, target, upstream_path in [
            ("/api/health", 18081, "/actuator/health"),
            ("/api/v1/risk-assessments?size=10", 18081, "/api/v1/risk-assessments?size=10"),
            ("/api/v1/merchants/me", 18080, "/api/v1/merchants/me"),
            ("/api/v1/llm/stats", 18001, "/api/v1/llm/stats"),
        ]:
            with self.request(path) as response:
                data = json.load(response)
            self.assertEqual(data["port"], target)
            self.assertEqual(data["path"], upstream_path)
            self.assertIsNone(data["secret"])
            self.assertEqual(data["authorization"], "Bearer synthetic-test-token")

    def test_unknown_api_and_actuator_not_exposed(self):
        for path in ["/api/no-such-endpoint", "/actuator/env"]:
            with self.assertRaises(HTTPError) as error:
                self.request(path)
            self.assertEqual(error.exception.code, 404)
            error.exception.close()


if __name__ == "__main__":
    unittest.main()
