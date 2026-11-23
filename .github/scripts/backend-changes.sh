#!/usr/bin/env bash
set -euo pipefail
# Fail safe: incomplete history must run verification, never silently skip it.
base=${1:-}
head=${2:-HEAD}
if [[ -z "$base" ]] || ! git cat-file -e "$base^{commit}" 2>/dev/null; then
  echo true
elif git diff --quiet "$base" "$head" -- backend/ contracts/ .github/workflows/ci-backend.yml .github/scripts/ .github/dependabot.yml; then
  echo false
else
  echo true
fi
