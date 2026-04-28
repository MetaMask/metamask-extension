#!/usr/bin/env bash
# stop-sandbox.sh — Tear down the agentic sandbox started by launch-sandbox.sh.
#
# Idempotent: safe to run when nothing is running. Kills the Chromium and
# launcher processes recorded in the agent dir, removes their PID files, and
# strips the SingletonLock so the next launch starts clean.
#
# Customizable env:
#   AGENT_DIR     Runtime state dir (default <repo>/temp/runtime)
#   PROFILE_DIR   Chrome profile dir (default $AGENT_DIR/chrome-profile)
set -euo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
if [ -z "${AGENT_DIR:-}" ]; then
  RUNTIME_DIR_RESOLVED="${RUNTIME_DIR_OVERRIDE:-${RUNTIME_DIR:-temp/runtime}}"
  case "$RUNTIME_DIR_RESOLVED" in
    /*) AGENT_DIR="$RUNTIME_DIR_RESOLVED" ;;
    *)  AGENT_DIR="$REPO/$RUNTIME_DIR_RESOLVED" ;;
  esac
fi
PROFILE_NAME="${PROFILE_NAME_OVERRIDE:-${PROFILE_NAME:-chrome-profile-pw}}"
PROFILE_DIR="${PROFILE_DIR:-$AGENT_DIR/$PROFILE_NAME}"

for pidfile in "$AGENT_DIR/launcher.pid" "$AGENT_DIR/browser.pid"; do
  if [ -f "$pidfile" ]; then
    pid=$(cat "$pidfile" 2>/dev/null || true)
    if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
      echo "[stop] killing $(basename "$pidfile") (PID $pid)"
      kill "$pid" 2>/dev/null || true
    fi
    rm -f "$pidfile"
  fi
done

rm -f "$AGENT_DIR/extension.id" "$AGENT_DIR/fixture-state.json"
rm -f "$PROFILE_DIR/SingletonLock"

echo "[stop] sandbox cleaned"
