#!/usr/bin/env bash
# launch-sandbox.sh — Launch isolated MetaMask Chromium for recipe runs.
#
# Idempotent: kills stale instance and relaunches. One sandbox per worktree by
# default; override env vars to run multiple in parallel.
#
# Usage:
#   bash test/agentic/launch-sandbox.sh
#   CDP_PORT=9333 SANDBOX_LABEL=stress bash test/agentic/launch-sandbox.sh
#
# Customizable env (defaults are repo-local + single-worktree friendly):
#   CDP_PORT          Remote debugging port (default 9222)
#   SANDBOX_LABEL     Window-title prefix (default "agentic")
#   AGENT_DIR         Runtime state dir (default <repo>/temp/runtime)
#   PROFILE_DIR       Chrome profile dir (default $AGENT_DIR/chrome-profile)
#   WALLET_FIXTURE    Wallet fixture JSON (default $AGENT_DIR/wallet-fixture.json)
#   EXTENSION_DIR     Built extension (default <repo>/dist/chrome)
#   LAUNCH_MODE       "fullscreen" (default) or "sidepanel"
#   CHROME_BIN        Override Chromium binary (default Playwright bundled)
set -euo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO"

# AGENT_DIR resolution honors farmslot's RUNTIME_DIR / RUNTIME_DIR_OVERRIDE so a
# farmslot slot (which exports RUNTIME_DIR=.agent) auto-aligns. Standalone dev
# falls back to temp/runtime, which is gitignored via the temp/ rule.
if [ -z "${AGENT_DIR:-}" ]; then
  RUNTIME_DIR_RESOLVED="${RUNTIME_DIR_OVERRIDE:-${RUNTIME_DIR:-temp/runtime}}"
  case "$RUNTIME_DIR_RESOLVED" in
    /*) AGENT_DIR="$RUNTIME_DIR_RESOLVED" ;;
    *)  AGENT_DIR="$REPO/$RUNTIME_DIR_RESOLVED" ;;
  esac
fi
export AGENT_DIR

PROFILE_NAME="${PROFILE_NAME_OVERRIDE:-${PROFILE_NAME:-chrome-profile-pw}}"
export PROFILE_DIR="${PROFILE_DIR:-$AGENT_DIR/$PROFILE_NAME}"
export WALLET_FIXTURE="${WALLET_FIXTURE:-$AGENT_DIR/wallet-fixture.json}"
export EXTENSION_DIR="${EXTENSION_DIR:-$REPO/dist/chrome}"
export CDP_PORT="${CDP_PORT:-9222}"
export SANDBOX_LABEL="${SANDBOX_LABEL:-${SESSION:-${SLOT_ID:-agentic}}}"
export LAUNCH_MODE="${LAUNCH_MODE:-fullscreen}"

if [ ! -f "$WALLET_FIXTURE" ]; then
  echo "FAIL: wallet fixture missing at $WALLET_FIXTURE"
  echo "  Copy template:"
  echo "    mkdir -p \"$(dirname "$WALLET_FIXTURE")\""
  echo "    cp test/agentic/wallet-fixture.example.json \"$WALLET_FIXTURE\""
  echo "    \$EDITOR \"$WALLET_FIXTURE\"   # set password + seed phrase"
  exit 1
fi

mkdir -p "$AGENT_DIR" "$PROFILE_DIR"

exec node "$REPO/test/agentic/setup/launch-sandbox.js"
