#!/bin/bash
# run-experiment.sh — Run one experiment: benchmark, then commit if improved or revert
#
# Use this AFTER making a code change. It runs the benchmark and automatically
# commits (if improved) or reverts (if not).
#
# Usage: ./development/autoresearch/run-experiment.sh [chrome|firefox] [description]
# Example: ./development/autoresearch/run-experiment.sh chrome "Add --no-first-run to Chrome args"
# The agent MUST pass the description (change done) as the second argument.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$REPO_ROOT"

BROWSER="${1:-chrome}"
DESCRIPTION="${2:-}"
RESULTS_FILE="$SCRIPT_DIR/results.tsv"

# Get current best from results.tsv (column 3 = setup_time_seconds)
if [ -f "$RESULTS_FILE" ] && [ "$(wc -l < "$RESULTS_FILE")" -gt 1 ]; then
    CURRENT_BEST=$(tail -n +2 "$RESULTS_FILE" | awk -F'\t' '{print $3}' | sort -n | head -1)
else
    CURRENT_BEST="9999"
fi

echo "Current best setup time: ${CURRENT_BEST}s"
echo "Running benchmark 3 times for mean accuracy..."
echo ""

# Run benchmark 3 times and collect setup_time_seconds
RUN_TIMES=()
for i in 1 2 3; do
    echo "=== Run $i/3 ==="
    BENCHMARK_OUTPUT=$(bash "$SCRIPT_DIR/autoresearch.sh" "$BROWSER" 2>&1) || {
        echo "$BENCHMARK_OUTPUT"
        echo ""
        echo "--- Benchmark failed. Reverting changes. ---"
        git checkout -- test/e2e/webdriver/chrome.js test/e2e/webdriver/firefox.js \
            test/e2e/helpers.js test/e2e/webdriver/driver.js test/e2e/webdriver/index.js 2>/dev/null || true
        exit 1
    }
    echo "$BENCHMARK_OUTPUT"
    T=$(echo "$BENCHMARK_OUTPUT" | grep '^setup_time_seconds=' | cut -d= -f2)
    if [ -z "$T" ]; then
        echo "--- Could not parse setup_time_seconds. Reverting. ---"
        git checkout -- test/e2e/webdriver/chrome.js test/e2e/webdriver/firefox.js \
            test/e2e/helpers.js test/e2e/webdriver/driver.js test/e2e/webdriver/index.js 2>/dev/null || true
        exit 1
    fi
    RUN_TIMES+=("$T")
    echo ""
done

# Compute mean (rounded to nearest integer)
SETUP_TIME=$(echo "${RUN_TIMES[0]} ${RUN_TIMES[1]} ${RUN_TIMES[2]}" | awk '{printf "%.0f", ($1+$2+$3)/3}')
echo "--- Setup times: ${RUN_TIMES[0]}s, ${RUN_TIMES[1]}s, ${RUN_TIMES[2]}s → mean: ${SETUP_TIME}s (best: ${CURRENT_BEST}s) ---"

if [ "$SETUP_TIME" -lt "$CURRENT_BEST" ]; then
    IMPROVEMENT=$((CURRENT_BEST - SETUP_TIME))
    EXPERIMENT_NUM=$(($(git log --oneline --all --grep="Experiment " 2>/dev/null | wc -l) + 1))
    CHANGED=$(git diff --name-only HEAD 2>/dev/null | head -1)
    COMMIT_DESC="${DESCRIPTION:-$CHANGED}"
    echo ""
    echo "*** IMPROVEMENT: -${IMPROVEMENT}s! Committing (experiment ${EXPERIMENT_NUM}). ***"
    git add -A
    git commit -m "Experiment ${EXPERIMENT_NUM} - ${COMMIT_DESC}" --no-verify
    echo "--- Committed. New best: ${SETUP_TIME}s ---"
else
    echo ""
    echo "--- No improvement. Reverting changes. ---"
    git checkout -- test/e2e/webdriver/chrome.js test/e2e/webdriver/firefox.js \
        test/e2e/helpers.js test/e2e/webdriver/driver.js test/e2e/webdriver/index.js 2>/dev/null || true
fi
