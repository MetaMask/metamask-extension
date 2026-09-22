#!/usr/bin/env bash
# Merge per-scenario benchmark JSON artifacts and generate the #6657 markdown report.
set -euo pipefail

ARTIFACT_DIR="${1:-test-artifacts/scratch-7550}"
PRE_7475_SHA="${PRE_7475_SHA:-23a9a0e2284fb7aa2e8fc51cb40553f93249ed30}"
PRE_7476_SHA="${PRE_7476_SHA:-384fb12684915651d4a82f6344de354309a9ed01}"
AFTER_SHA="${AFTER_SHA:-$(git rev-parse HEAD)}"

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../../.." && pwd)"
cd "$ROOT"

merge_json() {
  local existing=()
  local file
  for file in "$@"; do
    if [ -f "$file" ]; then
      existing+=("$file")
    else
      echo "Warning: missing benchmark artifact (skipped): $file" >&2
    fi
  done
  if [ "${#existing[@]}" -eq 0 ]; then
    echo '{}' 
    return
  fi
  jq -s 'add' "${existing[@]}"
}

# Prefer after-* JSON for the current AFTER_SHA; fall back to any after-* file so
# merge + report can combine a partial re-run with prior_run_id artifacts.
resolve_after_scenario_json() {
  local scenario_slug="$1"
  local preferred="$ARTIFACT_DIR/benchmark-chrome-webpack-after-${AFTER_SHA:0:7}-${scenario_slug}.json"
  if [ -f "$preferred" ]; then
    echo "$preferred"
    return
  fi
  local match
  match="$(find "$ARTIFACT_DIR" -maxdepth 1 -name "benchmark-chrome-webpack-after-*-${scenario_slug}.json" -print 2>/dev/null | sort | tail -1)"
  if [ -n "$match" ]; then
    echo "Warning: using after artifact (not current SHA): $match" >&2
    echo "$match"
    return
  fi
  echo ""
}

AFTER_TOKEN_JSON="$(resolve_after_scenario_json token-search-power-user)"
AFTER_SWITCH_JSON="$(resolve_after_scenario_json account-switch)"
AFTER_PREFIX="benchmark-chrome-webpack-after-${AFTER_SHA:0:7}"
AFTER_MERGED="$ARTIFACT_DIR/${AFTER_PREFIX}-merged.json"
merge_json "$AFTER_TOKEN_JSON" "$AFTER_SWITCH_JSON" > "$AFTER_MERGED"

BEFORE_TOKEN_JSON="$ARTIFACT_DIR/benchmark-chrome-webpack-before-${PRE_7475_SHA:0:7}-token-search-power-user.json"
BEFORE_SWITCH_PREFIX="benchmark-chrome-webpack-before-${PRE_7476_SHA:0:7}"
BEFORE_SWITCH_MERGED="$ARTIFACT_DIR/${BEFORE_SWITCH_PREFIX}-merged.json"
merge_json \
  "$ARTIFACT_DIR/${BEFORE_SWITCH_PREFIX}-account-switch.json" \
  > "$BEFORE_SWITCH_MERGED"

if [ ! -f "$AFTER_MERGED" ] || [ "$(cat "$AFTER_MERGED")" = '{}' ]; then
  echo "Error: no after benchmark artifacts found under $ARTIFACT_DIR" >&2
  exit 1
fi

yarn tsx test/e2e/benchmarks/scratch-7550/generate-report.mts \
  --after "$AFTER_MERGED" \
  --before-token "$BEFORE_TOKEN_JSON" \
  --before-switch "$BEFORE_SWITCH_MERGED" \
  --after-sha "$AFTER_SHA" \
  --before-token-sha "$PRE_7475_SHA" \
  --before-switch-sha "$PRE_7476_SHA" \
  --out "$ARTIFACT_DIR/react18-concurrent-perf-report.md"

echo "Report written to $ARTIFACT_DIR/react18-concurrent-perf-report.md"
