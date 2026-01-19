#!/usr/bin/env bash

# Verifies that required CI checks have passed on a given commit SHA.
#
# We only check 'all-jobs-pass' since it already gates on all other required
# checks (run-tests, e2e-chrome, e2e-firefox, builds, linting, etc.)
#
# Required environment variables:
#   GITHUB_TOKEN - GitHub token for API authentication
#   GITHUB_REPOSITORY - Repository in format owner/repo
#   RELEASE_SHA - The commit SHA to verify checks for
#
# Exit codes:
#   0 - All required checks passed
#   1 - Missing or failed checks

set -e
set -o pipefail

if [[ -z "${GITHUB_TOKEN}" ]]; then
    echo "::error::GITHUB_TOKEN not provided."
    exit 1
fi

if [[ -z "${GITHUB_REPOSITORY}" ]]; then
    echo "::error::GITHUB_REPOSITORY not provided."
    exit 1
fi

if [[ -z "${RELEASE_SHA}" ]]; then
    echo "::error::RELEASE_SHA not provided."
    exit 1
fi

echo "Verifying CI checks on SHA: ${RELEASE_SHA}"

# Fetch all check runs for the commit
CHECK_RUNS=$(
  gh api \
    -H "Accept: application/vnd.github+json" \
    "/repos/${GITHUB_REPOSITORY}/commits/${RELEASE_SHA}/check-runs" \
    --paginate |
    jq -s '{check_runs: [.[].check_runs[]]}'
)

print_check_run_names() {
    echo ""
    echo "=== Check runs found on SHA ${RELEASE_SHA} ==="
    echo "${CHECK_RUNS}" | jq -r '.check_runs[] | "\(.name) (status: \(.status), conclusion: \(.conclusion))"' | sort -u
}

# Look for 'all-jobs-pass' or 'All jobs pass' (the check that gates all CI)
# Prefer the most recent check-run (reruns can create multiple).
CHECK_RESULT=$(
    echo "${CHECK_RUNS}" | jq -c '
      [.check_runs[] | select(.name == "all-jobs-pass" or .name == "All jobs pass")]
      | sort_by(.completed_at // .started_at // "")
      | reverse
      | .[0]
      | if . == null then empty else {name: .name, status: .status, conclusion: .conclusion} end
    '
)

if [[ -z "${CHECK_RESULT}" || "${CHECK_RESULT}" == "null" ]]; then
    echo "::error::Required check 'all-jobs-pass' not found on SHA ${RELEASE_SHA}"
    echo "::error::Ensure CI has run on this SHA before publishing."
    print_check_run_names
    exit 1
fi

CHECK_NAME=$(echo "${CHECK_RESULT}" | jq -r '.name')
STATUS=$(echo "${CHECK_RESULT}" | jq -r '.status')
CONCLUSION=$(echo "${CHECK_RESULT}" | jq -r '.conclusion')

echo "Found check: ${CHECK_NAME} (status: ${STATUS}, conclusion: ${CONCLUSION})"

if [[ "${STATUS}" != "completed" ]]; then
    echo "::error::Check '${CHECK_NAME}' is still running (status: ${STATUS})"
    echo "::error::Wait for CI to complete before publishing."
    exit 1
fi

if [[ "${CONCLUSION}" != "success" ]]; then
    echo "::error::Check '${CHECK_NAME}' did not succeed (conclusion: ${CONCLUSION})"
    echo "::error::All CI checks must pass before publishing."
    print_check_run_names
    exit 1
fi

echo ""
echo "✅ CI check '${CHECK_NAME}' passed - all required checks verified"
