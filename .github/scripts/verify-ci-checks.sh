#!/usr/bin/env bash
# Verifies the 'All jobs pass' commit status has succeeded on RELEASE_SHA.
#
# ci-status-gate.yml posts a commit status with context "All jobs pass"
# after every CI run. This script queries the commit statuses API to
# confirm the release SHA passed CI before publishing.
#
# Required env: GITHUB_TOKEN, GITHUB_REPOSITORY, RELEASE_SHA

set -euo pipefail

if [[ -z "${GITHUB_TOKEN:-}" ]]; then
    echo "::error::GITHUB_TOKEN not provided."
    exit 1
fi

if [[ -z "${GITHUB_REPOSITORY:-}" ]]; then
    echo "::error::GITHUB_REPOSITORY not provided."
    exit 1
fi

if [[ -z "${RELEASE_SHA:-}" ]]; then
    echo "::error::RELEASE_SHA not provided."
    exit 1
fi

echo "Verifying CI status on SHA: ${RELEASE_SHA}"

# Fetch the combined status (latest state per context) for this commit.
COMBINED_STATUS=$(
  gh api \
    -H "Accept: application/vnd.github+json" \
    "/repos/${GITHUB_REPOSITORY}/commits/${RELEASE_SHA}/status"
)

print_commit_statuses() {
    echo ""
    echo "=== Commit statuses found on SHA ${RELEASE_SHA} ==="
    echo "${COMBINED_STATUS}" | jq -r '.statuses[] | "\(.context) (state: \(.state))"' | sort -u
}

# Find the "All jobs pass" commit status (posted by ci-status-gate.yml).
STATUS_STATE=$(
    echo "${COMBINED_STATUS}" | jq -r '
      .statuses[]
      | select(.context == "All jobs pass")
      | .state
    '
)

if [[ -z "${STATUS_STATE}" ]]; then
    echo "::error::Required commit status 'All jobs pass' not found on SHA ${RELEASE_SHA}"
    echo "::error::Ensure CI has run on this SHA before publishing."
    print_commit_statuses
    exit 1
fi

echo "Found commit status: All jobs pass (state: ${STATUS_STATE})"

if [[ "${STATUS_STATE}" != "success" ]]; then
    echo "::error::Commit status 'All jobs pass' did not succeed (state: ${STATUS_STATE})"
    echo "::error::All CI checks must pass before publishing."
    print_commit_statuses
    exit 1
fi

echo ""
echo "✅ Commit status 'All jobs pass' succeeded — all required checks verified"
