#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../../.." && pwd)"
cd "$ROOT"

ITERATIONS="${BENCHMARK_ITERATIONS:-5}"
RETRIES="${BENCHMARK_RETRIES:-2}"
ARTIFACT_DIR="${1:-test-artifacts/scratch-7550}"
PRE_7475_SHA="${PRE_7475_SHA:-23a9a0e2284fb7aa2e8fc51cb40553f93249ed30}"
PRE_7476_SHA="${PRE_7476_SHA:-384fb12684915651d4a82f6344de354309a9ed01}"
AFTER_SHA="$(git rev-parse HEAD)"

HARNESS_PATHS=(
  test/e2e/benchmarks/scratch-7550
  test/e2e/benchmarks/flows/interaction/scratch-7550
  test/e2e/benchmarks/utils/constants.ts
  test/e2e/benchmarks/run-benchmark.ts
  test/e2e/benchmarks/utils/thresholds.ts
  app/scripts/fixtures/generate-wallet-state.js
)

restore_harness_files() {
  git checkout HEAD -- "${HARNESS_PATHS[@]}"
}

benchmark_json_path() {
  local label="$1"
  echo "$ARTIFACT_DIR/benchmark-chrome-webpack-${label}.json"
}

run_preset() {
  local label="$1"
  local out_file
  out_file="$(benchmark_json_path "$label")"
  mkdir -p "$ARTIFACT_DIR"
  SELENIUM_BROWSER=chrome SELENIUM_HEADLESS=true \
    yarn test:e2e:benchmark:7550 \
    --iterations "$ITERATIONS" \
    --retries "$RETRIES" \
    --out "$out_file"
}

checkout_app_at_sha() {
  local sha="$1"
  git checkout "$sha" -- .
  restore_harness_files
}

restore_full_tree() {
  git checkout HEAD -- .
}

build_and_run() {
  local label="$1"
  echo "=== Building test extension for ${label} ($(git rev-parse HEAD)) ==="
  yarn build:test
  run_preset "$label"
}

echo "Scratch #7550 comparison — after @ ${AFTER_SHA}"

AFTER_LABEL="after-${AFTER_SHA:0:7}"
AFTER_JSON="$(benchmark_json_path "$AFTER_LABEL")"

if [ "${SKIP_AFTER_BUILD:-}" = "1" ] && [ -d dist/chrome ]; then
  echo "=== After @ ${AFTER_SHA} (using existing dist/) ==="
  run_preset "$AFTER_LABEL"
else
  build_and_run "$AFTER_LABEL"
fi

echo "=== Before token search @ ${PRE_7475_SHA} ==="
checkout_app_at_sha "$PRE_7475_SHA"
BEFORE_TOKEN_LABEL="before-token-${PRE_7475_SHA:0:7}"
BEFORE_TOKEN_JSON="$(benchmark_json_path "$BEFORE_TOKEN_LABEL")"
build_and_run "$BEFORE_TOKEN_LABEL"

echo "=== Before account/network @ ${PRE_7476_SHA} ==="
checkout_app_at_sha "$PRE_7476_SHA"
BEFORE_SWITCH_LABEL="before-switch-${PRE_7476_SHA:0:7}"
BEFORE_SWITCH_JSON="$(benchmark_json_path "$BEFORE_SWITCH_LABEL")"
build_and_run "$BEFORE_SWITCH_LABEL"

restore_full_tree

yarn tsx test/e2e/benchmarks/scratch-7550/generate-report.mts \
  --after "$AFTER_JSON" \
  --before-token "$BEFORE_TOKEN_JSON" \
  --before-switch "$BEFORE_SWITCH_JSON" \
  --after-sha "$AFTER_SHA" \
  --before-token-sha "$PRE_7475_SHA" \
  --before-switch-sha "$PRE_7476_SHA" \
  --out "$ARTIFACT_DIR/react18-concurrent-perf-report.md"

echo "Report written to $ARTIFACT_DIR/react18-concurrent-perf-report.md"
