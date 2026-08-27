#!/usr/bin/env bash
# Run after + before for a single scratch-7550 benchmark file (used by CI matrix jobs).
set -euo pipefail

SCENARIO="${1:?Usage: run-scenario-comparison.sh <scenario-slug> <before-sha> [artifact-dir]}"
BEFORE_SHA="${2:?Missing before-sha}"
ARTIFACT_DIR="${3:-test-artifacts/scratch-7550}"

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../../.." && pwd)"
cd "$ROOT"

ITERATIONS="${BENCHMARK_ITERATIONS:-5}"
RETRIES="${BENCHMARK_RETRIES:-1}"
AFTER_SHA="$(git rev-parse HEAD)"
BENCHMARK_FILE="test/e2e/benchmarks/flows/interaction/scratch-7550/${SCENARIO}.ts"

HARNESS_PATHS=(
  test/e2e/benchmarks/scratch-7550
  test/e2e/benchmarks/flows/interaction/scratch-7550
  test/e2e/benchmarks/utils/constants.ts
  test/e2e/benchmarks/run-benchmark.ts
  test/e2e/benchmarks/utils/thresholds.ts
  app/scripts/fixtures/generate-wallet-state.js
)

APP_SOURCE_PATHS=(
  app
  ui
  shared
  types
)

restore_harness_files() {
  git checkout HEAD -- "${HARNESS_PATHS[@]}"
}

benchmark_json_path() {
  local label="$1"
  echo "$ARTIFACT_DIR/benchmark-chrome-webpack-${label}.json"
}

run_single() {
  local label="$1"
  local out_file
  out_file="$(benchmark_json_path "$label")"
  mkdir -p "$ARTIFACT_DIR"
  SELENIUM_BROWSER=chrome SELENIUM_HEADLESS=true \
    yarn tsx test/e2e/benchmarks/run-benchmark.ts "$BENCHMARK_FILE" \
    --iterations "$ITERATIONS" \
    --retries "$RETRIES" \
    --out "$out_file"
}

checkout_app_at_sha() {
  local sha="$1"
  git checkout "$sha" -- "${APP_SOURCE_PATHS[@]}"
  restore_harness_files
}

build_and_run() {
  local label="$1"
  echo "=== Building test extension for ${label} ($(git rev-parse HEAD)) ==="
  yarn webpack:tsc
  yarn build:test
  run_single "$label"
}

AFTER_LABEL="after-${AFTER_SHA:0:7}-${SCENARIO}"
BEFORE_LABEL="before-${BEFORE_SHA:0:7}-${SCENARIO}"

echo "=== Scenario: ${SCENARIO} — after @ ${AFTER_SHA} ==="

if [ "${SKIP_AFTER_BUILD:-}" = "1" ] && [ -d dist/chrome ]; then
  echo "=== After (using existing dist/) ==="
  run_single "$AFTER_LABEL"
else
  build_and_run "$AFTER_LABEL"
fi

echo "=== Scenario: ${SCENARIO} — before @ ${BEFORE_SHA} ==="
checkout_app_at_sha "$BEFORE_SHA"
build_and_run "$BEFORE_LABEL"

echo "Done: ${SCENARIO}"
