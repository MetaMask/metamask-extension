#!/bin/bash
# autoresearch.checks.sh — Correctness gate for E2E setup time experiments
#
# Runs BEFORE the timed benchmark. If it fails, the experiment is discarded.
#
# Usage: ./development/autoresearch/autoresearch.checks.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$REPO_ROOT"

ERRORS=0

echo "--- Check 1: Modified files are within allowed scope ---"

MODIFIED_FILES=$(git diff --name-only HEAD 2>/dev/null || true)
if [ -n "$MODIFIED_FILES" ]; then
    while IFS= read -r file; do
        case "$file" in
            test/e2e/webdriver/chrome.js) ;;
            test/e2e/webdriver/firefox.js) ;;
            test/e2e/helpers.js) ;;
            test/e2e/webdriver/driver.js) ;;
            test/e2e/webdriver/index.js) ;;
            development/autoresearch/autoresearch.ideas.md) ;;
            development/autoresearch/results.tsv) ;;
            *)
                echo "  OUT OF SCOPE: $file"
                ERRORS=$((ERRORS + 1))
                ;;
        esac
    done <<< "$MODIFIED_FILES"
fi

if [ "$ERRORS" -gt 0 ]; then
    echo "FAILED: $ERRORS file(s) modified outside allowed scope"
    exit 1
fi
echo "  OK: All modified files are within scope"

echo "--- Check 2: No syntax errors in modified JS files ---"

for file in $MODIFIED_FILES; do
    if [[ "$file" == *.js ]]; then
        if ! node --check "$file" 2>/dev/null; then
            echo "  SYNTAX ERROR: $file"
            ERRORS=$((ERRORS + 1))
        fi
    fi
done

if [ "$ERRORS" -gt 0 ]; then
    echo "FAILED: $ERRORS file(s) have syntax errors"
    exit 1
fi
echo "  OK: No syntax errors in modified files"

echo "--- Check 3: package.json and yarn.lock unchanged ---"

if ! git diff --quiet HEAD -- package.json yarn.lock 2>/dev/null; then
    echo "  FAILED: package.json or yarn.lock has been modified"
    exit 1
fi
echo "  OK: Dependencies unchanged"

echo "--- Check 4: Frozen files unchanged ---"

FROZEN_FILES=(
    "development/autoresearch/autoresearch.sh"
    "development/autoresearch/autoresearch.checks.sh"
    "development/autoresearch/autoresearch.md"
    "development/autoresearch/program.md"
)

for frozen in "${FROZEN_FILES[@]}"; do
    if ! git diff --quiet HEAD -- "$frozen" 2>/dev/null; then
        echo "  FROZEN FILE MODIFIED: $frozen"
        ERRORS=$((ERRORS + 1))
    fi
done

if [ "$ERRORS" -gt 0 ]; then
    echo "FAILED: $ERRORS frozen file(s) were modified"
    exit 1
fi
echo "  OK: All frozen files unchanged"

echo ""
echo "All pre-benchmark checks passed."
