#!/usr/bin/env bash
# Build and run scratch-7550 benchmarks at a historical SHA via git worktree.
# Partial checkout (app/ui + old package.json) breaks webpack; use a full tree.
# Overlay only test/e2e/benchmarks from HEAD — not all of test/e2e — so page
# objects/helpers stay at the before SHA and match the old built extension.
set -euo pipefail

copy_harness_to() {
  local target_root="$1"
  local source_root="$2"
  local path
  for path in "${HARNESS_PATHS[@]}"; do
    if [ -d "$source_root/$path" ]; then
      mkdir -p "$target_root/$(dirname "$path")"
      rm -rf "$target_root/$path"
      cp -R "$source_root/$path" "$target_root/$path"
    elif [ -f "$source_root/$path" ]; then
      mkdir -p "$target_root/$(dirname "$path")"
      cp "$source_root/$path" "$target_root/$path"
    else
      echo "Harness path missing at HEAD: $path" >&2
      exit 1
    fi
  done
}

remove_worktree() {
  local worktree_path="$1"
  if [ -d "$worktree_path" ]; then
    git worktree remove --force "$worktree_path" 2>/dev/null || rm -rf "$worktree_path"
  fi
  git worktree prune 2>/dev/null || true
}

patch_worktree_allow_scripts() {
  node <<'NODE'
const fs = require('fs');
const pkgPath = 'package.json';
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
pkg.lavamoat ??= {};
pkg.lavamoat.allowScripts ??= {};
const required = {
  'sass-loader>sass>@parcel/watcher#2.5.6': false,
};
let changed = false;
for (const [key, value] of Object.entries(required)) {
  if (!Object.hasOwn(pkg.lavamoat.allowScripts, key)) {
    pkg.lavamoat.allowScripts[key] = value;
    changed = true;
  }
}
if (changed) {
  fs.writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
}
NODE
}

install_worktree_dependencies() {
  # Old SHAs may predate allowScripts entries that newer lock resolutions need.
  patch_worktree_allow_scripts
  if grep -q 'plugin-allow-scripts' .yarnrc.yml 2>/dev/null; then
    yarn plugin remove @yarnpkg/plugin-allow-scripts
  fi
  yarn install --immutable
}

# CI runs mm-foundryup on the parent checkout only; postinstall skips foundryup in CI.
# Worktrees need anvil on PATH for network/activity benchmarks.
ensure_anvil_on_path() {
  local parent_root="$1"
  if [ -x "${parent_root}/node_modules/.bin/anvil" ]; then
    export PATH="${parent_root}/node_modules/.bin:${PATH}"
    echo "=== Using anvil from parent checkout (${parent_root}/node_modules/.bin) ==="
  else
    echo "=== Installing Foundry (anvil) in worktree ==="
    yarn mm-foundryup
  fi
}

run_before_at_sha() {
  local sha="$1"
  local worktree_id="$2"
  local benchmark_file="$3"
  local out_file="$4"
  local iterations="$5"
  local retries="$6"
  local root="$7"

  local worktree_path="$root/${ARTIFACT_DIR}/worktrees/${worktree_id}"
  mkdir -p "$(dirname "$out_file")"

  remove_worktree "$worktree_path"
  echo "=== Creating worktree for before @ ${sha} ==="
  git worktree add --detach "$worktree_path" "$sha"

  copy_harness_to "$worktree_path" "$root"

  (
    cd "$worktree_path"
    echo "=== Installing dependencies in worktree @ ${sha} ==="
    install_worktree_dependencies
    ensure_anvil_on_path "$root"
    echo "=== Building test extension in worktree @ ${sha} ==="
    yarn webpack:tsc
    yarn build:test
    echo "=== Running benchmark in worktree @ ${sha} ==="
    SELENIUM_BROWSER=chrome SELENIUM_HEADLESS=true \
      yarn tsx test/e2e/benchmarks/run-benchmark.ts "$benchmark_file" \
      --iterations "$iterations" \
      --retries "$retries" \
      --out "$out_file"
  )

  remove_worktree "$worktree_path"
}

run_before_preset_at_sha() {
  local sha="$1"
  local worktree_id="$2"
  local out_file="$3"
  local iterations="$4"
  local retries="$5"
  local root="$6"

  local worktree_path="$root/${ARTIFACT_DIR}/worktrees/${worktree_id}"
  mkdir -p "$(dirname "$out_file")"

  remove_worktree "$worktree_path"
  echo "=== Creating worktree for before @ ${sha} ==="
  git worktree add --detach "$worktree_path" "$sha"

  copy_harness_to "$worktree_path" "$root"

  (
    cd "$worktree_path"
    echo "=== Installing dependencies in worktree @ ${sha} ==="
    install_worktree_dependencies
    ensure_anvil_on_path "$root"
    echo "=== Building test extension in worktree @ ${sha} ==="
    yarn webpack:tsc
    yarn build:test
    echo "=== Running scratch-7550 preset in worktree @ ${sha} ==="
    SELENIUM_BROWSER=chrome SELENIUM_HEADLESS=true \
      yarn test:e2e:benchmark:7550 \
      --iterations "$iterations" \
      --retries "$retries" \
      --out "$out_file"
  )

  remove_worktree "$worktree_path"
}
