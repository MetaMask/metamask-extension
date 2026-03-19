#!/bin/bash
# autoresearch.sh — Benchmark runner for E2E setup time optimization
#
# Measures the time to run one send-eth test (setup + first test). Setup dominates
# (browser open, extension inject, waitForControllers), so total duration is a good proxy.
#
# Usage: ./development/autoresearch/autoresearch.sh [chrome|firefox]
# Default: chrome (faster iteration)
# Output: Key=Value pairs on stdout, parseable by the agent
#
# Prerequisites: Node >=24.13 (run `nvm use` if needed), yarn, test build (yarn build:test)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$REPO_ROOT"

# Use project Node version if nvm is available
if [ -f "$REPO_ROOT/.nvmrc" ] && [ -f "${NVM_DIR:-$HOME/.nvm}/nvm.sh" ]; then
    # shellcheck source=/dev/null
    . "${NVM_DIR:-$HOME/.nvm}/nvm.sh"
    nvm use
fi

BROWSER="${1:-chrome}"
RESULTS_FILE="$SCRIPT_DIR/results.tsv"

# ============================================================================
# Phase 1: Correctness Checks
# ============================================================================

echo "=== PHASE 1: Correctness Checks ==="

if ! bash "$SCRIPT_DIR/autoresearch.checks.sh"; then
    echo ""
    echo "========================================="
    echo "CHECKS: FAILED"
    echo "========================================="
    exit 1
fi

echo "=== Checks passed, proceeding to benchmark ==="

# ============================================================================
# Phase 2: Ensure test build exists
# ============================================================================

if [ "$BROWSER" = "firefox" ]; then
    if [ ! -d "dist/firefox" ]; then
        echo "=== Building test build (Firefox MV2) ==="
        yarn build:test:mv2
    fi
    export SELENIUM_BROWSER=firefox
else
    if [ ! -d "dist/chrome" ]; then
        echo "=== Building test build (Chrome) ==="
        yarn build:test
    fi
    export SELENIUM_BROWSER=chrome
fi

# ============================================================================
# Phase 3: Timed E2E Run (first send-eth test only)
# ============================================================================

echo "=== PHASE 2: Timed E2E Run (send-eth, first test) ==="

# Run only the first test ("Wallet initiated sends ETH"); total duration includes setup
# Use "Wallet" to match the first describe block (E2E_ARGS is split by space)
TEST_START=$(date +%s)
TEST_OUTPUT=$(E2E_ARGS="--grep Wallet" E2E_DEBUG=false yarn test:e2e:single test/e2e/tests/send/send-eth.spec.ts --browser="$BROWSER" 2>&1) || {
    echo "$TEST_OUTPUT"
    echo ""
    echo "========================================="
    echo "CHECKS: FAILED"
    echo "FAILURE_REASON: E2E test exited with non-zero status"
    echo "========================================="
    exit 1
}

TEST_END=$(date +%s)
SETUP_TIME_SECONDS=$((TEST_END - TEST_START))

# ============================================================================
# Phase 4: Parse Duration from output (fallback)
# ============================================================================

# Mocha/enhanced reporter outputs "Duration: Xs" or "X passing (Ys)"
PARSED_DURATION=$(echo "$TEST_OUTPUT" | grep -oE 'Duration: [0-9.]+s' | grep -oE '[0-9.]+' || true)
if [ -n "$PARSED_DURATION" ]; then
    SETUP_TIME_SECONDS=$(printf "%.0f" "$PARSED_DURATION")
fi

# ============================================================================
# Phase 5: Output Results
# ============================================================================

GIT_SHA=$(git rev-parse --short HEAD)
GIT_DIRTY=$(git diff --quiet && echo "clean" || echo "dirty")
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

echo ""
echo "========================================="
echo "CHECKS: PASSED"
echo "========================================="
echo ""
echo "=== METRICS ==="
echo "setup_time_seconds=$SETUP_TIME_SECONDS"
echo "browser=$BROWSER"
echo "git_sha=$GIT_SHA"
echo "git_dirty=$GIT_DIRTY"
echo "timestamp=$TIMESTAMP"
echo "==============="

# ============================================================================
# Phase 6: Append to Results Log
# ============================================================================

if [ ! -f "$RESULTS_FILE" ]; then
    echo -e "timestamp\tgit_sha\tsetup_time_seconds\tbrowser\tnotes" > "$RESULTS_FILE"
fi

echo -e "$TIMESTAMP\t$GIT_SHA\t$SETUP_TIME_SECONDS\t$BROWSER\t" >> "$RESULTS_FILE"

echo ""
echo "Results appended to $RESULTS_FILE"
