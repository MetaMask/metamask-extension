#!/usr/bin/env bash
# preflight.sh — Verify the sandbox can be launched.
#
# Checks: extension build present, wallet fixture present, ports free, deps
# resolve. Prints actionable next steps when something is missing. Does NOT
# launch anything — call launch-sandbox.sh after this passes.
set -euo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO"

if [ -z "${AGENT_DIR:-}" ]; then
  RUNTIME_DIR_RESOLVED="${RUNTIME_DIR_OVERRIDE:-${RUNTIME_DIR:-temp/runtime}}"
  case "$RUNTIME_DIR_RESOLVED" in
    /*) AGENT_DIR="$RUNTIME_DIR_RESOLVED" ;;
    *)  AGENT_DIR="$REPO/$RUNTIME_DIR_RESOLVED" ;;
  esac
fi
EXTENSION_DIR="${EXTENSION_DIR:-$REPO/dist/chrome}"
WALLET_FIXTURE="${WALLET_FIXTURE:-$AGENT_DIR/wallet-fixture.json}"
CDP_PORT="${CDP_PORT:-9222}"

fail=0

echo "=== Agentic sandbox preflight ==="

if [ ! -f "$EXTENSION_DIR/manifest.json" ]; then
  echo "MISS: $EXTENSION_DIR/manifest.json"
  echo "  Run \`yarn start\` in another terminal and wait for the first build."
  fail=1
elif [ ! -f "$EXTENSION_DIR/scripts/app-init.js" ]; then
  echo "MISS: $EXTENSION_DIR/scripts/app-init.js (build incomplete)"
  echo "  Wait for \`yarn start\` to finish bundling, then re-run preflight."
  fail=1
else
  echo "OK   extension build at $EXTENSION_DIR"
fi

if [ ! -f "$WALLET_FIXTURE" ]; then
  echo "MISS: $WALLET_FIXTURE"
  echo "  mkdir -p \"$(dirname "$WALLET_FIXTURE")\""
  echo "  cp test/agentic/wallet-fixture.example.json \"$WALLET_FIXTURE\""
  echo "  \$EDITOR \"$WALLET_FIXTURE\"   # testnet seed only — never mainnet"
  fail=1
else
  echo "OK   wallet fixture at $WALLET_FIXTURE"
fi

if [ ! -f "$REPO/.metamaskrc" ]; then
  echo "MISS: .metamaskrc at repo root"
  echo "  cp .metamaskrc.dist .metamaskrc"
  fail=1
else
  echo "OK   .metamaskrc"
fi

if lsof -i ":${CDP_PORT}" -t >/dev/null 2>&1; then
  echo "WARN: CDP port ${CDP_PORT} already in use — launch-sandbox.sh will kill the process holding it."
else
  echo "OK   CDP port ${CDP_PORT} free"
fi

for dep in @ethereumjs/util @metamask/browser-passworder classic-level playwright; do
  if ! node -e "require.resolve('${dep}')" 2>/dev/null; then
    echo "MISS: node module ${dep}"
    echo "  yarn install"
    fail=1
  fi
done

if ! command -v jq >/dev/null 2>&1; then
  echo "MISS: jq (used by recipe runner)"
  echo "  brew install jq"
  fail=1
fi

if [ "$fail" -eq 0 ]; then
  echo "=== Preflight OK ==="
  exit 0
fi
echo "=== Preflight FAIL ==="
exit 1
