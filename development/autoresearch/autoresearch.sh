#!/bin/bash
# autoresearch.sh — Benchmark runner for MetaMask build performance experiments
#
# This script is the EVALUATION FUNCTION for the autoresearch loop.
# It runs correctness checks, builds the extension, and outputs structured metrics.
#
# DO NOT MODIFY THIS FILE — it is part of the frozen evaluation harness.
#
# Usage: ./development/autoresearch/autoresearch.sh
# Output: Key=Value pairs on stdout, parseable by the agent

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$REPO_ROOT"

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

echo "=== Checks passed, proceeding to build ==="

# ============================================================================
# Phase 2: Clean previous build
# ============================================================================

rm -rf dist/

# ============================================================================
# Phase 3: Timed Build
# ============================================================================

echo "=== PHASE 2: Timed Build (yarn dist) ==="

BUILD_START=$(date +%s)

# Capture build output to parse task timeline
BUILD_OUTPUT=$(yarn dist 2>&1) || {
    echo "$BUILD_OUTPUT"
    echo ""
    echo "========================================="
    echo "CHECKS: FAILED"
    echo "FAILURE_REASON: yarn dist exited with non-zero status"
    echo "========================================="
    exit 1
}

BUILD_END=$(date +%s)
BUILD_TIME_SECONDS=$((BUILD_END - BUILD_START))

# ============================================================================
# Phase 4: Post-build Validation
# ============================================================================

echo "=== PHASE 3: Post-build Validation ==="

# Verify critical output files exist
MISSING_FILES=0
for f in \
    dist/chrome/background-0.js \
    dist/chrome/ui-0.js \
    dist/chrome/common-0.js \
    dist/chrome/manifest.json \
    dist/chrome/scripts/runtime-lavamoat.js \
    dist/chrome/scripts/policy-load.js; do
    if [ ! -f "$f" ]; then
        echo "MISSING OUTPUT: $f"
        MISSING_FILES=$((MISSING_FILES + 1))
    fi
done

if [ "$MISSING_FILES" -gt 0 ]; then
    echo ""
    echo "========================================="
    echo "CHECKS: FAILED"
    echo "FAILURE_REASON: $MISSING_FILES expected output files missing"
    echo "========================================="
    exit 1
fi

# Verify LavaMoat runtime is present (confirms LavaMoat was applied)
if [ ! -f "dist/chrome/scripts/runtime-lavamoat.js" ]; then
    echo ""
    echo "========================================="
    echo "CHECKS: FAILED"
    echo "FAILURE_REASON: runtime-lavamoat.js missing — LavaMoat may have been bypassed"
    echo "========================================="
    exit 1
fi

# ============================================================================
# Phase 5: Collect Metrics
# ============================================================================

echo "=== PHASE 4: Collecting Metrics ==="

# Bundle sizes
BUNDLE_SIZE_TOTAL_KB=$(find dist/chrome -name '*.js' -not -path '*/scripts/*' -exec cat {} + | wc -c | awk '{printf "%.1f", $1/1024}')
SCRIPTS_SIZE_TOTAL_KB=$(find dist/chrome/scripts -name '*.js' -exec cat {} + | wc -c | awk '{printf "%.1f", $1/1024}')
BUNDLE_COUNT=$(find dist/chrome -name '*.js' -not -path '*/scripts/*' | wc -l | tr -d ' ')
DIST_SIZE_MB=$(du -sm dist/chrome/ | awk '{print $1}')

# Parse standardEntryPoints time from build output (the bottleneck task)
STANDARD_ENTRY_SECONDS=$(echo "$BUILD_OUTPUT" | grep -o 'scripts:core:dist:standardEntryPoints [0-9.]*s' | grep -o '[0-9.]*' || echo "N/A")

# Parse total dist time from build output
DIST_TASK_SECONDS=$(echo "$BUILD_OUTPUT" | grep -o '█.* dist [0-9.]*s' | grep -o '[0-9.]*' || echo "N/A")

# Current git state
GIT_SHA=$(git rev-parse --short HEAD)
GIT_DIRTY=$(git diff --quiet && echo "clean" || echo "dirty")
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# ============================================================================
# Phase 6: Output Results
# ============================================================================

echo ""
echo "========================================="
echo "CHECKS: PASSED"
echo "========================================="
echo ""
echo "=== METRICS ==="
echo "build_time_seconds=$BUILD_TIME_SECONDS"
echo "dist_task_seconds=$DIST_TASK_SECONDS"
echo "standard_entry_points_seconds=$STANDARD_ENTRY_SECONDS"
echo "bundle_size_total_kb=$BUNDLE_SIZE_TOTAL_KB"
echo "scripts_size_total_kb=$SCRIPTS_SIZE_TOTAL_KB"
echo "bundle_count=$BUNDLE_COUNT"
echo "dist_size_mb=$DIST_SIZE_MB"
echo "git_sha=$GIT_SHA"
echo "git_dirty=$GIT_DIRTY"
echo "timestamp=$TIMESTAMP"
echo "==============="

# ============================================================================
# Phase 7: Append to Results Log
# ============================================================================

# Create header if results file doesn't exist
if [ ! -f "$RESULTS_FILE" ]; then
    echo -e "timestamp\tgit_sha\tbuild_time_seconds\tdist_task_seconds\tstandard_entry_points_seconds\tbundle_size_total_kb\tscripts_size_total_kb\tbundle_count\tdist_size_mb\tnotes" > "$RESULTS_FILE"
fi

# Append this run's results (notes column left empty — agent can fill it)
echo -e "$TIMESTAMP\t$GIT_SHA\t$BUILD_TIME_SECONDS\t$DIST_TASK_SECONDS\t$STANDARD_ENTRY_SECONDS\t$BUNDLE_SIZE_TOTAL_KB\t$SCRIPTS_SIZE_TOTAL_KB\t$BUNDLE_COUNT\t$DIST_SIZE_MB\t" >> "$RESULTS_FILE"

echo ""
echo "Results appended to $RESULTS_FILE"
