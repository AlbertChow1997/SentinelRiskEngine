"""Retry the public frontend and health endpoint, without logging bodies/headers."""
import json
import sys
import time
from urllib.error import URLError
from urllib.parse import urlparse
from urllib.request import urlopen


def check(base):
    parsed = urlparse(base)
    if parsed.scheme != "https" or not parsed.hostname or not parsed.hostname.endswith(".cloudfront.net") or parsed.path not in ["", "/"] or parsed.query or parsed.username:
        raise ValueError("Supply only the HTTPS CloudFront base URL")
    with urlopen(base.rstrip("/")+"/", timeout=10) as response:
        if response.status != 200 or b"<!doctype html" not in response.read(1024).lower():
            raise ValueError("Frontend smoke failed")
    with urlopen(base.rstrip("/")+"/api/health", timeout=10) as response:
        if response.status != 200 or json.load(response).get("status") != "UP":
            raise ValueError("Backend health smoke failed")


if __name__ == "__main__":
    for attempt in range(60):
        try:
            check(sys.argv[1])
            print("CloudFront frontend and backend health smoke passed.")
            break
        except (ValueError, URLError, TimeoutError):
            if attempt == 59:
                sys.exit("Staging smoke did not become healthy; inspect private service events/logs.")
            time.sleep(5)
