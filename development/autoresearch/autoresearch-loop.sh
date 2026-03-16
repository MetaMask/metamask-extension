#!/bin/bash
# autoresearch-loop.sh — Main orchestration loop for autoresearch experiments
#
# This script drives the autoresearch loop by calling Aider in non-interactive
# mode. Each iteration:
#   1. Aider reads autoresearch.md + ideas.md + results.tsv
#   2. Aider proposes and makes ONE code change
#   3. autoresearch.sh runs the benchmark
#   4. If improved → commit. If not → revert.
#   5. Repeat.
#
# Usage:
#   ./development/autoresearch/autoresearch-loop.sh [OPTIONS]
#
# Options:
#   --max-experiments N    Maximum experiments to run (default: 100)
#   --model MODEL          Model name for Aider (default: openai/qwen3.5-27b)
#   --api-base URL         OpenAI-compatible API base (default: http://host.docker.internal:8080/v1)
#   --dry-run              Print the prompt without running Aider
#
# Prerequisites:
#   - Aider installed and accessible in PATH
#   - llama-server running on host (accessible at API base URL)
#   - Git repo in clean state on the autoresearch branch

set -euo pipefail

# ============================================================================
# Configuration
# ============================================================================

MAX_EXPERIMENTS=100
MODEL="openai/qwen3.5-27b"
API_BASE="http://host.docker.internal:8080/v1"
DRY_RUN=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --max-experiments) MAX_EXPERIMENTS="$2"; shift 2 ;;
        --model) MODEL="$2"; shift 2 ;;
        --api-base) API_BASE="$2"; shift 2 ;;
        --dry-run) DRY_RUN=true; shift ;;
        *) echo "Unknown option: $1"; exit 1 ;;
    esac
done

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$REPO_ROOT"

RESULTS_FILE="$SCRIPT_DIR/results.tsv"
AUTORESEARCH_MD="$SCRIPT_DIR/autoresearch.md"
IDEAS_MD="$SCRIPT_DIR/autoresearch.ideas.md"

# Files the agent is allowed to edit
EDITABLE_FILES=(
    "babel.config.js"
    "development/build/scripts.js"
    "development/build/config.js"
    "development/build/styles.js"
    "development/build/static.js"
    "development/build/manifest.js"
    "development/build/utils.js"
    "development/build/set-environment-variables.js"
    "development/autoresearch/autoresearch.ideas.md"
)

# ============================================================================
# Pre-flight Checks
# ============================================================================

echo "=== Autoresearch Loop ==="
echo "Model: $MODEL"
echo "API Base: $API_BASE"
echo "Max experiments: $MAX_EXPERIMENTS"
echo ""

# Check git is clean (except results.tsv and ideas.md)
DIRTY_FILES=$(git diff --name-only HEAD -- ':!development/autoresearch/results.tsv' ':!development/autoresearch/autoresearch.ideas.md' 2>/dev/null || true)
if [ -n "$DIRTY_FILES" ]; then
    echo "ERROR: Git working tree has uncommitted changes outside autoresearch tracking files:"
    echo "$DIRTY_FILES"
    echo "Please commit or stash changes before running the loop."
    exit 1
fi

# Check Aider is available
if ! command -v aider &> /dev/null; then
    echo "ERROR: aider not found in PATH. Install it: pip install aider-chat"
    exit 1
fi

# Get current best build time from results.tsv (or use baseline)
if [ -f "$RESULTS_FILE" ] && [ "$(wc -l < "$RESULTS_FILE")" -gt 1 ]; then
    CURRENT_BEST=$(tail -n +2 "$RESULTS_FILE" | awk -F'\t' '{print $3}' | sort -n | head -1)
else
    CURRENT_BEST="999"
fi

echo "Current best build time: ${CURRENT_BEST}s"
echo ""

# ============================================================================
# Build the Aider Prompt
# ============================================================================

build_prompt() {
    local experiment_num=$1
    local current_best=$2

    # Include recent results history (last 10 experiments)
    local results_context=""
    if [ -f "$RESULTS_FILE" ] && [ "$(wc -l < "$RESULTS_FILE")" -gt 1 ]; then
        results_context="## Recent Experiment Results (last 10)

$(head -1 "$RESULTS_FILE")
$(tail -n +2 "$RESULTS_FILE" | tail -10)
"
    fi

    cat <<PROMPT
You are running experiment $experiment_num of a build performance optimization loop.

Read the autoresearch objective and strategy from: development/autoresearch/autoresearch.md
Read the ideas backlog from: development/autoresearch/autoresearch.ideas.md

$results_context

Current best build time: ${current_best}s
Your goal: beat ${current_best}s while passing all correctness checks.

## Instructions

1. Review the objective, strategy, and ideas backlog
2. Pick ONE untried idea from the backlog (or propose a new one if you have a better hypothesis)
3. Make a SINGLE, focused code change to implement it
4. IMPORTANT: Only modify files listed in the "Files In Scope" section of autoresearch.md
5. After making the change, I will run the benchmark separately

DO NOT run autoresearch.sh yourself — just make the code change and explain what you changed and why.
DO NOT modify multiple things at once — one change per experiment.
DO NOT modify package.json, yarn.lock, or any frozen files.
PROMPT
}

# ============================================================================
# Main Loop
# ============================================================================

for ((i=1; i<=MAX_EXPERIMENTS; i++)); do
    echo ""
    echo "========================================================"
    echo "  EXPERIMENT $i / $MAX_EXPERIMENTS"
    echo "  Current best: ${CURRENT_BEST}s"
    echo "========================================================"
    echo ""

    # Build the prompt for this iteration
    PROMPT=$(build_prompt "$i" "$CURRENT_BEST")

    if [ "$DRY_RUN" = true ]; then
        echo "--- DRY RUN: Prompt ---"
        echo "$PROMPT"
        echo "--- END ---"
        exit 0
    fi

    # Run Aider to make the code change
    # --yes: auto-accept file edits
    # --no-git: we handle git ourselves
    # --message: non-interactive single prompt
    echo "--- Calling Aider to propose change ---"
    aider \
        --openai-api-base "$API_BASE" \
        --model "$MODEL" \
        --no-git \
        --yes \
        --no-auto-commits \
        --read "$AUTORESEARCH_MD" \
        --read "$IDEAS_MD" \
        --file "${EDITABLE_FILES[@]}" \
        --message "$PROMPT" \
        2>&1 | tee "/tmp/autoresearch-aider-$i.log" || true

    # Check if any files were actually changed
    CHANGED=$(git diff --name-only 2>/dev/null || true)
    if [ -z "$CHANGED" ]; then
        echo "--- No files changed by Aider. Skipping benchmark. ---"
        continue
    fi

    echo ""
    echo "--- Files changed: ---"
    echo "$CHANGED"
    echo ""

    # Run the benchmark
    echo "--- Running benchmark ---"
    BENCHMARK_OUTPUT=$(bash "$SCRIPT_DIR/autoresearch.sh" 2>&1) || {
        echo "$BENCHMARK_OUTPUT"
        echo ""
        echo "--- EXPERIMENT $i: FAILED (checks or build failed) ---"
        echo "--- Reverting changes ---"
        git checkout -- .
        continue
    }

    echo "$BENCHMARK_OUTPUT"

    # Parse build time from output
    BUILD_TIME=$(echo "$BENCHMARK_OUTPUT" | grep '^build_time_seconds=' | cut -d= -f2)

    if [ -z "$BUILD_TIME" ]; then
        echo "--- Could not parse build time. Reverting. ---"
        git checkout -- .
        continue
    fi

    echo ""
    echo "--- Build time: ${BUILD_TIME}s (best: ${CURRENT_BEST}s) ---"

    # Compare with current best
    if [ "$BUILD_TIME" -lt "$CURRENT_BEST" ]; then
        IMPROVEMENT=$((CURRENT_BEST - BUILD_TIME))
        echo ""
        echo "*** IMPROVEMENT: -${IMPROVEMENT}s! Keeping changes. ***"
        echo ""

        # Commit the successful experiment
        DESCRIPTION=$(echo "$CHANGED" | head -1)
        git add -A
        git commit -m "autoresearch: experiment $i — ${BUILD_TIME}s (-${IMPROVEMENT}s) — $DESCRIPTION" --no-verify

        # Update current best
        CURRENT_BEST="$BUILD_TIME"

        echo "--- Committed. New best: ${CURRENT_BEST}s ---"
    else
        echo ""
        echo "--- EXPERIMENT $i: No improvement (${BUILD_TIME}s >= ${CURRENT_BEST}s). Reverting. ---"
        git checkout -- .
    fi

    echo ""
    echo "--- Experiment $i complete ---"
done

echo ""
echo "========================================================"
echo "  AUTORESEARCH LOOP COMPLETE"
echo "  Ran $MAX_EXPERIMENTS experiments"
echo "  Final best build time: ${CURRENT_BEST}s"
echo "========================================================"
