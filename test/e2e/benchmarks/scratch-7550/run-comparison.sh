#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../../.." && pwd)"
cd "$ROOT"

# shellcheck source=before-worktree-lib.sh
source "$(dirname "${BASH_SOURCE[0]}")/before-worktree-lib.sh"

ITERATIONS="${BENCHMARK_ITERATIONS:-20}"
RETRIES="${BENCHMARK_RETRIES:-2}"
ARTIFACT_DIR="${1:-test-artifacts/scratch-7550}"
PRE_7475_SHA="${PRE_7475_SHA:-23a9a0e2284fb7aa2e8fc51cb40553f93249ed30}"
PRE_7476_SHA="${PRE_7476_SHA:-384fb12684915651d4a82f6344de354309a9ed01}"
AFTER_SHA="$(git rev-parse HEAD)"

# Overlay HEAD benchmark harness only — keep the worktree's test/e2e page-objects,
# helpers, and flows so Selenium targets the old UI built from the before SHA.
HARNESS_PATHS=(
  test/e2e/benchmarks
  app/scripts/fixtures/generate-wallet-state.js
)

benchmark_json_path() {
  local label="$1"
  echo "$ROOT/$ARTIFACT_DIR/benchmark-chrome-webpack-${label}.json"
}

run_preset() {
  local label="$1"
  local out_file
  out_file="$(benchmark_json_path "$label")"
  mkdir -p "$(dirname "$out_file")"
  SELENIUM_BROWSER=chrome SELENIUM_HEADLESS=true \
    yarn test:e2e:benchmark:7550 \
    --iterations "$ITERATIONS" \
    --retries "$RETRIES" \
    --out "$out_file"
}

build_and_run() {
  local label="$1"
  echo "=== Building test extension for ${label} ($(git rev-parse HEAD)) ==="
  yarn webpack:tsc
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
BEFORE_TOKEN_LABEL="before-token-${PRE_7475_SHA:0:7}"
BEFORE_TOKEN_JSON="$(benchmark_json_path "$BEFORE_TOKEN_LABEL")"
run_before_preset_at_sha \
  "$PRE_7475_SHA" \
  "before-token-${PRE_7475_SHA:0:7}" \
  "$BEFORE_TOKEN_JSON" \
  "$ITERATIONS" \
  "$RETRIES" \
  "$ROOT"

echo "=== Before account/network @ ${PRE_7476_SHA} ==="
BEFORE_SWITCH_LABEL="before-switch-${PRE_7476_SHA:0:7}"
BEFORE_SWITCH_JSON="$(benchmark_json_path "$BEFORE_SWITCH_LABEL")"
run_before_preset_at_sha \
  "$PRE_7476_SHA" \
  "before-switch-${PRE_7476_SHA:0:7}" \
  "$BEFORE_SWITCH_JSON" \
  "$ITERATIONS" \
  "$RETRIES" \
  "$ROOT"

yarn tsx test/e2e/benchmarks/scratch-7550/generate-report.mts \
  --after "$AFTER_JSON" \
  --before-token "$BEFORE_TOKEN_JSON" \
  --before-switch "$BEFORE_SWITCH_JSON" \
  --after-sha "$AFTER_SHA" \
  --before-token-sha "$PRE_7475_SHA" \
  --before-switch-sha "$PRE_7476_SHA" \
  --out "$ROOT/$ARTIFACT_DIR/react18-concurrent-perf-report.md"

echo "Report written to $ROOT/$ARTIFACT_DIR/react18-concurrent-perf-report.md"
