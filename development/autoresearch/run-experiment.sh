#!/bin/bash
# run-experiment.sh — Run one experiment: benchmark, then commit if improved or revert
#
# Use this AFTER making a code change. It runs the benchmark and automatically
# commits (if improved) or reverts (if not).
#
# Usage: ./development/autoresearch/run-experiment.sh [chrome|firefox]
# Or: have the agent run this after making a change

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$REPO_ROOT"

BROWSER="${1:-chrome}"
RESULTS_FILE="$SCRIPT_DIR/results.tsv"

# Get current best from results.tsv (column 3 = setup_time_seconds)
if [ -f "$RESULTS_FILE" ] && [ "$(wc -l < "$RESULTS_FILE")" -gt 1 ]; then
    CURRENT_BEST=$(tail -n +2 "$RESULTS_FILE" | awk -F'\t' '{print $3}' | sort -n | head -1)
else
    CURRENT_BEST="9999"
fi

echo "Current best setup time: ${CURRENT_BEST}s"
echo ""

# Run benchmark
BENCHMARK_OUTPUT=$(bash "$SCRIPT_DIR/autoresearch.sh" "$BROWSER" 2>&1) || {
    echo "$BENCHMARK_OUTPUT"
    echo ""
    echo "--- Benchmark failed. Reverting changes. ---"
    git checkout -- test/e2e/webdriver/chrome.js test/e2e/webdriver/firefox.js \
        test/e2e/helpers.js test/e2e/webdriver/driver.js test/e2e/webdriver/index.js 2>/dev/null || true
    exit 1
}

echo "$BENCHMARK_OUTPUT"

SETUP_TIME=$(echo "$BENCHMARK_OUTPUT" | grep '^setup_time_seconds=' | cut -d= -f2)
if [ -z "$SETUP_TIME" ]; then
    echo "--- Could not parse setup_time_seconds. Reverting. ---"
    git checkout -- test/e2e/webdriver/chrome.js test/e2e/webdriver/firefox.js \
        test/e2e/helpers.js test/e2e/webdriver/driver.js test/e2e/webdriver/index.js 2>/dev/null || true
    exit 1
fi

echo ""
echo "--- Setup time: ${SETUP_TIME}s (best: ${CURRENT_BEST}s) ---"

if [ "$SETUP_TIME" -lt "$CURRENT_BEST" ]; then
    IMPROVEMENT=$((CURRENT_BEST - SETUP_TIME))
    echo ""
    echo "*** IMPROVEMENT: -${IMPROVEMENT}s! Committing. ***"
    CHANGED=$(git diff --name-only HEAD 2>/dev/null | head -1)
    git add -A
    git commit -m "autoresearch: ${SETUP_TIME}s (-${IMPROVEMENT}s) — $CHANGED" --no-verify
    echo "--- Committed. New best: ${SETUP_TIME}s ---"
else
    echo ""
    echo "--- No improvement. Reverting changes. ---"
    git checkout -- test/e2e/webdriver/chrome.js test/e2e/webdriver/firefox.js \
        test/e2e/helpers.js test/e2e/webdriver/driver.js test/e2e/webdriver/index.js 2>/dev/null || true
fi
