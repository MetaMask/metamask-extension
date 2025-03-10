#!/usr/bin/env bash

set -e
set -u
set -o pipefail

# Skip running e2e tests if the HEAD commit is tagged correctly
if git show --format='%B' --no-patch "$GITHUB_SHA" | grep --fixed-strings --quiet '[skip e2e]'
then
    printf '%s\n' "$GITHUB_SHA contains the tag '[skip e2e]' so e2e tests will not run"
    exit 1
fi

TIMEOUT_MINUTES=$(yarn tsx .github/scripts/test-run-e2e-timeout-minutes.ts)
echo "TIMEOUT_MINUTES: $TIMEOUT_MINUTES"

# Run the actual test command from the parameters
timeout "${TIMEOUT_MINUTES}"m "$@" --retries 1

# Error code 124 means the command timed out
if [ $? -eq 124 ]
then
  echo 'Timeout error, deleting the test results'
  rm -rf test/test-results/e2e
  exit 124
fi

exit 0
