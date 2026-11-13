#!/usr/bin/env bash
# Prints the API mock sync output to the job log and the job summary.
# sync-report.txt is stdout (changed APIs). sync-warnings.txt is stderr:
# skip notices, refused writes, fetch errors, and `info` drift in rows this
# pull request did not change.
#
# Usage: e2e-api-mock-sync-summary.sh <exit-code>

set -euo pipefail

EXIT="${1:?exit code required}"

cat sync-report.txt
if [ -s sync-warnings.txt ]; then
  cat sync-warnings.txt >&2
fi

grep '^info ' sync-warnings.txt > sync-info.txt || true
grep -v '^info ' sync-warnings.txt > sync-other-warnings.txt || true

{
  if [ -s sync-info.txt ]; then
    echo "### Other API drift (not blocking)"
    echo
    echo "These mocks were not changed by this pull request. The weekly sync updates them."
    echo
    sed 's/^info /- /' sync-info.txt
    echo
  fi
  if [ -s sync-other-warnings.txt ]; then
    echo "### API mock sync warnings"
    echo
    cat sync-other-warnings.txt
    echo
  fi
  # Exit 1 gets its own drift section from e2e-api-mock-drift-report.sh.
  if [ "${EXIT}" -ne 0 ] && [ "${EXIT}" -ne 1 ]; then
    cat sync-report.txt
  fi
} >> "${GITHUB_STEP_SUMMARY}"
