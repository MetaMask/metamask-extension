#!/usr/bin/env bash

set -e
set -u
set -o pipefail

# Skip running e2e tests if the HEAD commit is tagged correctly
if git show --format='%B' --no-patch "$CIRCLE_SHA1" | grep --fixed-strings --quiet '[skip e2e]'
then
    printf '%s\n' "$CIRCLE_SHA1 contains the tag '[skip e2e]' so e2e tests will not run"
    exit 1
fi

# Run the actual test command from the parameters
timeout 20m "$@" --retries 1

# Error code 124 means the command timed out
if [ $? -eq 124 ]; then
  # Once deleted, if someone tries to "Rerun failed tests" the result will be
  # "Error: can not rerun failed tests: no failed tests could be found"
  echo 'Timeout error, deleting the test results'
  rm -rf test/test-results/e2e
  exit 124
fi

exit 0
