#!/usr/bin/env bash
set -euo pipefail
# Run from the repository root. No broad suppression: an exception is valid only
# against its byte-exact pre-authentication baseline and listed operation/message.
base_ref=${BASE_REF:-origin/main}
mkdir -p .contracts-base
for file in contracts/openapi-*.yaml; do
  name=$(basename "$file")
  if ! git cat-file -e "$base_ref:$file" 2>/dev/null; then
    echo "$file: new contract; no baseline"
    continue
  fi
  git show "$base_ref:$file" > ".contracts-base/$name"
  args=()
  checksum="contracts/compatibility/$name.sha256"
  if [[ -f "$checksum" && -f "contracts/compatibility/$name.txt" ]] &&
     [[ $(sha256sum ".contracts-base/$name" | cut -d' ' -f1) == "$(cat "$checksum")" ]]; then
    args=(--err-ignore "contracts/compatibility/$name.txt")
    echo "$file: applying ADR-0012's baseline-specific JWT transition"
  fi
  docker run --rm -v "$PWD":/work -w /work tufin/oasdiff \
    breaking ".contracts-base/$name" "$file" --fail-on ERR "${args[@]}"
done
