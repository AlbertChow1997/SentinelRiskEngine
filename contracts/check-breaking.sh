#!/usr/bin/env bash
set -euo pipefail
# Run from the repository root. Fails on any breaking change against BASE_REF;
# there are no suppressions. A justified break needs a new version and an ADR.
base_ref=${BASE_REF:-origin/main}
mkdir -p .contracts-base
for file in contracts/openapi-*.yaml; do
  name=$(basename "$file")
  if ! git cat-file -e "$base_ref:$file" 2>/dev/null; then
    echo "$file: new contract; no baseline"
    continue
  fi
  git show "$base_ref:$file" > ".contracts-base/$name"
  docker run --rm -v "$PWD":/work -w /work tufin/oasdiff \
    breaking ".contracts-base/$name" "$file" --fail-on ERR
done
