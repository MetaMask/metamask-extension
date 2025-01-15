#!/usr/bin/env bash

set -e
set -u
set -o pipefail

COMMAND="${1:-}"
if [[ "$COMMAND" != "check" && "$COMMAND" != "update" ]]; then
  echo "Usage: $0 [check|update]"
  exit 1
fi

# Common madge arguments for circular dependency detection
MADGE_ARGS="--circular --extensions js,jsx,ts,tsx --exclude '(test|stories|storybook|\.test\.|\.spec\.)' --ts-config tsconfig.json --webpack-config webpack.config.js . --json"

if [[ "$COMMAND" == "check" ]]; then
  # Generate current circular dependencies
  yarn madge $MADGE_ARGS > circular-deps.temp.json

  # Compare with existing file
  if ! diff circular-deps.temp.json circular-deps.json > /dev/null 2>&1; then
    echo "Error: Circular dependencies have changed."
    echo "Run '@metamaskbot update-circular-deps' to update the circular dependencies file."
    rm circular-deps.temp.json
    exit 1
  fi

  rm circular-deps.temp.json
  echo "Circular dependencies check passed."
else
  # Generate circular dependencies and update the file
  yarn madge $MADGE_ARGS > circular-deps.json
  echo "Updated circular-deps.json with current circular dependencies."
fi