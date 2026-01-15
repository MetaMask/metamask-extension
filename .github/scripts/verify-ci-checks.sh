#!/usr/bin/env bash

# Verifies that required CI checks have passed on a given commit SHA.
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
    echo "::error::GITHUB_TOKEN not provided. Set the 'GITHUB_TOKEN' environment variable."
    exit 1
fi

if [[ -z "${GITHUB_REPOSITORY}" ]]; then
    echo "::error::GITHUB_REPOSITORY not provided. Set the 'GITHUB_REPOSITORY' environment variable."
    exit 1
fi

if [[ -z "${RELEASE_SHA}" ]]; then
    echo "::error::RELEASE_SHA not provided. Set the 'RELEASE_SHA' environment variable."
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

# Required checks that must pass.
# Each entry is a pipe-delimited set of acceptable check-run names.
REQUIRED_CHECKS=("run-tests|Run tests" "all-jobs-pass|All jobs pass")

# Track check results
FAILED_CHECKS=()
MISSING_CHECKS=()
PASSED_CHECKS=()

# Function to check a single check run
print_check_run_names() {
    echo ""
    echo "=== Check runs found on SHA ${RELEASE_SHA} ==="
    echo "${CHECK_RUNS}" | jq -r '.check_runs[] | "\(.name) (status: \(.status), conclusion: \(.conclusion))"' | sort -u
}

check_run_status() {
    local check_name_aliases="${1}"
    local is_required="${2:-true}"

    local check_result=""
    local matched_name=""
    IFS='|' read -r -a check_name_candidates <<< "${check_name_aliases}"

    for candidate in "${check_name_candidates[@]}"; do
        # Prefer the most recent check-run for this name (reruns can create multiple).
        check_result=$(
            echo "${CHECK_RUNS}" | jq -r --arg name "${candidate}" '
              [.check_runs[] | select(.name == $name)]
              | sort_by(.completed_at // .started_at // "")
              | reverse
              | .[0]
              | if . == null then empty else {status: .status, conclusion: .conclusion} end
            '
        )
        if [[ "${check_result}" == "null" ]]; then
            check_result=""
        fi
        if [[ -n "${check_result}" ]]; then
            matched_name="${candidate}"
            break
        fi
    done

    if [[ -z "${check_result}" ]]; then
        if [[ "${is_required}" == "true" ]]; then
            echo "::warning::Check '${check_name_aliases}' not found on SHA ${RELEASE_SHA}"
            MISSING_CHECKS+=("${check_name_aliases}")
        else
            # E2E checks might not exist if needs-e2e was false
            echo "ℹ️ E2E check '${check_name_aliases}' not found (may have been skipped by needs-e2e)"
            PASSED_CHECKS+=("${check_name_aliases} (not required)")
        fi
        return
    fi

    local status conclusion
    status=$(echo "${check_result}" | jq -r '.status')
    conclusion=$(echo "${check_result}" | jq -r '.conclusion')

    if [[ "${status}" != "completed" ]]; then
        if [[ "${is_required}" == "true" ]]; then
            echo "::warning::Check '${matched_name}' is still running (status: ${status})"
            FAILED_CHECKS+=("${matched_name} (still running)")
        else
            echo "ℹ️ Optional check '${matched_name}' is still running (status: ${status})"
            PASSED_CHECKS+=("${matched_name} (still running, optional)")
        fi
    elif [[ "${conclusion}" == "success" ]]; then
        echo "✅ Check '${matched_name}' passed"
        PASSED_CHECKS+=("${matched_name}")
    elif [[ "${conclusion}" == "skipped" ]]; then
        if [[ "${is_required}" == "true" ]]; then
            echo "::error::Check '${matched_name}' was skipped"
            FAILED_CHECKS+=("${matched_name} (skipped)")
        else
            echo "⏭️ Optional check '${matched_name}' was skipped"
            PASSED_CHECKS+=("${matched_name} (skipped)")
        fi
    else
        echo "::error::Check '${matched_name}' failed (conclusion: ${conclusion})"
        FAILED_CHECKS+=("${matched_name} (${conclusion})")
    fi
}

# Verify required checks
for check_name_aliases in "${REQUIRED_CHECKS[@]}"; do
    check_run_status "${check_name_aliases}" "true"
done

# Additionally check e2e-chrome and e2e-firefox, but allow them to be skipped
E2E_CHECKS=("e2e-chrome|E2E Chrome" "e2e-firefox|E2E Firefox")
for check_name_aliases in "${E2E_CHECKS[@]}"; do
    check_run_status "${check_name_aliases}" "false"
done

# Report results
echo ""
echo "=== CI Check Verification Summary ==="
echo "Passed: ${#PASSED_CHECKS[@]}"
echo "Failed: ${#FAILED_CHECKS[@]}"
echo "Missing: ${#MISSING_CHECKS[@]}"

# Fail if any required checks are missing or failed
if [[ ${#MISSING_CHECKS[@]} -gt 0 ]]; then
    echo ""
    echo "::error::Missing required checks: ${MISSING_CHECKS[*]}"
    echo "::error::Ensure CI has run on this SHA before publishing."
    print_check_run_names
    exit 1
fi

if [[ ${#FAILED_CHECKS[@]} -gt 0 ]]; then
    echo ""
    echo "::error::Failed checks: ${FAILED_CHECKS[*]}"
    echo "::error::All required CI checks must pass before publishing."
    print_check_run_names
    exit 1
fi

echo ""
echo "✅ All required CI checks verified successfully"
