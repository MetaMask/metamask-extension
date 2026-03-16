#!/bin/bash
# autoresearch.checks.sh — Correctness gate for autoresearch experiments
#
# This script runs BEFORE the timed build. If it fails, the experiment is
# discarded immediately without wasting time on a full build.
#
# DO NOT MODIFY THIS FILE — it is part of the frozen evaluation harness.
#
# Usage: ./development/autoresearch/autoresearch.checks.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$REPO_ROOT"

ERRORS=0

echo "--- Check 1: Modified files are within allowed scope ---"

# Get list of modified files (staged + unstaged)
MODIFIED_FILES=$(git diff --name-only HEAD 2>/dev/null || true)
if [ -n "$MODIFIED_FILES" ]; then
    while IFS= read -r file; do
        case "$file" in
            babel.config.js) ;;
            development/build/scripts.js) ;;
            development/build/config.js) ;;
            development/build/styles.js) ;;
            development/build/static.js) ;;
            development/build/manifest.js) ;;
            development/build/utils.js) ;;
            development/build/set-environment-variables.js) ;;
            development/build/transforms/*) ;;
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

# Quick syntax check on modified JS files using Node
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
    "development/build/index.js"
    "development/build/task.js"
    "development/build/display.js"
    "development/build/constants.js"
    "development/autoresearch/autoresearch.sh"
    "development/autoresearch/autoresearch.checks.sh"
    "development/autoresearch/autoresearch.md"
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
echo "All pre-build checks passed."
