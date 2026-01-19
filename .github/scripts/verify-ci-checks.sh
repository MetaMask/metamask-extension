#!/usr/bin/env bash
# Verifies 'all-jobs-pass' CI check has passed on RELEASE_SHA.
# Required env: GITHUB_TOKEN, GITHUB_REPOSITORY, RELEASE_SHA

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

# Fetch all check runs for the commit (30s timeout per request)
CHECK_RUNS=$(
  gh api \
    -H "Accept: application/vnd.github+json" \
    "/repos/${GITHUB_REPOSITORY}/commits/${RELEASE_SHA}/check-runs" \
    --paginate \
    --timeout 30s |
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
