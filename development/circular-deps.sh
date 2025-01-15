#!/usr/bin/env bash

set -e
set -u
set -o pipefail

COMMAND="${1:-}"
if [[ "$COMMAND" != "check" && "$COMMAND" != "update" ]]; then
  echo "Usage: $0 [check|update]"
  exit 1
fi

# Normalizes JSON output by sorting both the individual cycles and the array of cycles.
# This ensures consistent output regardless of cycle starting point.
#
# Example:
#   Input cycle:  B -> C -> A -> B
#   Output cycle: A -> B -> C -> A
#
# The normalization allows for reliable diff comparisons by eliminating ordering variations.
normalize_json() {
  node -e '
    const cycles = JSON.parse(require("fs").readFileSync(0, "utf-8"));
    const normalized = cycles.map(cycle => [...cycle].sort()).sort();
    console.log(JSON.stringify(normalized, null, 2));
  '
}

# Common madge arguments for circular dependency detection
MADGE_ARGS="--circular --extensions js,jsx,ts,tsx --exclude '(test|stories|storybook|\.test\.|\.spec\.)' --ts-config tsconfig.json --webpack-config webpack.config.js . --json"

# Function to run madge and normalize output
madge_json() {
  yarn madge $MADGE_ARGS | normalize_json
}

if [[ "$COMMAND" == "check" ]]; then
  # Generate current circular dependencies
  madge_json > circular-deps.temp.json || true


  # Compare files silently
  DIFF_OUTPUT=$(diff circular-deps.json circular-deps.temp.json || true)

  if [ -n "$DIFF_OUTPUT" ]; then
    echo "Error: Codebase circular dependencies are out of sync in circular-deps.json"
    echo "You can resolve this by either:"
    echo "1. Add comment '@metamaskbot update-circular-deps' on this PR"
    echo "2. Run 'yarn circular-deps:update' locally and commit the changes."
    rm circular-deps.temp.json
    exit 1
  fi

  rm circular-deps.temp.json
  echo "Circular dependencies check passed."
else
  # Generate circular dependencies and update the file
  madge_json > circular-deps.json || true

  echo "Wrote circular dependencies to circular-deps.json"
fi
