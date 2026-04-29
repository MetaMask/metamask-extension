#!/usr/bin/env bash
# sandbox.sh — Lifecycle entrypoint for the agentic sandbox.
#
# Subcommands:
#   up [--force]
#             Preflight (waits for build), launch isolated Chromium, unlock wallet.
#             If no `yarn start` is running and dist/chrome is stale, starts one
#             in the background (log: $AGENT_DIR/watcher.log). Refuses if a
#             healthy sandbox is already running on this CDP_PORT, reuses it.
#             Pass --force (or -f) to relaunch the sandbox tracked by this AGENT_DIR. A
#             lockfile under $AGENT_DIR/.sandbox.lock blocks concurrent invocations.
#   down      Kill the sandbox Chromium + launcher; clean PID files.
#   clean [--yes]
#             `down` + delete the Chrome profile dir. Prompts for confirmation
#             unless --yes / -y is passed (or stdin is non-TTY, in which case
#             --yes is required). Use after a profile corruption error.
#   status    Connect via CDP and print extension/wallet/perps state.
#   reload    Soft-restart the extension service worker (after a code edit).
#
# Customizable env (defaults are repo-local + single-worktree friendly):
#   CDP_PORT         Remote debugging port (default 9222 with a warning;
#                    pick a unique port per worktree to avoid collisions).
#   SANDBOX_LABEL    Window-title prefix (default "agentic").
#   RUNTIME_DIR      Resolved relative to repo root unless absolute (default
#                    temp/runtime). RUNTIME_DIR_OVERRIDE wins if set.
#   AGENT_DIR        Override the resolved runtime dir directly.
#   PROFILE_NAME     Chrome profile dir name under $AGENT_DIR (default chrome-profile-pw).
#   PROFILE_DIR      Override the full profile path.
#   WALLET_FIXTURE   Wallet fixture JSON (default $AGENT_DIR/wallet-fixture.json).
#   EXTENSION_DIR    Built extension (default <repo>/dist/chrome).
#   LAUNCH_MODE      `fullscreen` (default) or `sidepanel`.
#   CHROME_BIN       Override Chromium binary (default Playwright bundled).
#   BUILD_TIMEOUT    Seconds preflight waits for the build to finish (default 180).
#
# Usage:
#   bash test/agentic/sandbox.sh up
#   CDP_PORT=9223 SANDBOX_LABEL=feature-b bash test/agentic/sandbox.sh up
#   bash test/agentic/sandbox.sh status
#   bash test/agentic/sandbox.sh reload
#   bash test/agentic/sandbox.sh down
set -euo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && cd .. && pwd)"
cd "$REPO"

# Source the per-worktree config file if present. All knobs (CDP_PORT,
# SANDBOX_LABEL, WALLET_FIXTURE, RUNTIME_DIR, ...) can be set here so you don't
# have to re-export them in every shell. Real env vars still win — they're set
# before the file's `export` lines run, so existing exports are preserved.
SANDBOX_ENV="${SANDBOX_ENV:-$REPO/test/agentic/.env}"
if [ -f "$SANDBOX_ENV" ]; then
  while IFS= read -r _line || [ -n "$_line" ]; do
    [[ "$_line" =~ ^[[:space:]]*(#|$) ]] && continue
    _line="${_line#export }"
    _key="${_line%%=*}"
    _key="${_key//[[:space:]]/}"
    [[ -n "$_key" && -z "${!_key+x}" ]] && eval "export $_line" 2>/dev/null || true
  done < "$SANDBOX_ENV"
  unset _line _key
fi

# ---- env defaults ------------------------------------------------------------
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
export SANDBOX_LABEL="${SANDBOX_LABEL:-agentic}"
export LAUNCH_MODE="${LAUNCH_MODE:-fullscreen}"
BUILD_TIMEOUT="${BUILD_TIMEOUT:-180}"

ensure_cdp_port() {
  if [ -z "${CDP_PORT:-}" ]; then
    export CDP_PORT=9222
    echo "[warn] CDP_PORT not set — defaulting to 9222."
    echo "       Multiple sandboxes will collide on this port; export CDP_PORT=<unique>"
    echo "       per worktree to isolate (e.g. CDP_PORT=9223 for the next one)."
  fi
  # Reject obvious typos early so the launcher doesn't waste time.
  if ! [[ "$CDP_PORT" =~ ^[0-9]+$ ]] || [ "$CDP_PORT" -lt 1024 ] || [ "$CDP_PORT" -gt 65535 ]; then
    echo "FAIL: CDP_PORT=\"$CDP_PORT\" must be an integer in 1024..65535." >&2
    exit 2
  fi
}

# ---- preflight ---------------------------------------------------------------
run_preflight() {
  ensure_cdp_port
  local fail=0
  echo "=== Agentic sandbox preflight ==="

  build_wait() {
    local label="$1" file="$2"
    if [ -f "$file" ]; then echo "OK   $label"; return 0; fi
    echo "WAIT $label — polling up to ${BUILD_TIMEOUT}s for \`yarn start\` to produce it..."
    local i
    for i in $(seq 1 "$BUILD_TIMEOUT"); do
      if [ -f "$file" ]; then echo "OK   $label (after ${i}s)"; return 0; fi
      [ $((i % 15)) -eq 0 ] && echo "     still waiting (${i}s)..."
      sleep 1
    done
    echo "MISS: $file did not appear in ${BUILD_TIMEOUT}s"
    echo "  Make sure \`yarn start\` is running in another terminal."
    return 1
  }
  build_wait "extension manifest" "$EXTENSION_DIR/manifest.json" || fail=1
  if [ "$fail" -eq 0 ]; then
    build_wait "service worker bundle" "$EXTENSION_DIR/scripts/app-init.js" || fail=1
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
    echo "WARN: CDP port ${CDP_PORT} already in use — use a unique CDP_PORT or stop the holder first."
  else
    echo "OK   CDP port ${CDP_PORT} free"
  fi

  for dep in @ethereumjs/util @metamask/browser-passworder @metamask/eth-hd-keyring classic-level playwright; do
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
    return 0
  fi
  echo "=== Preflight FAIL ==="
  return 1
}

# ---- subcommands -------------------------------------------------------------
cmd_up() {
  local force=0
  while [[ $# -gt 0 ]]; do
    case "$1" in
      -f|--force) force=1; shift ;;
      *) echo "Unknown arg to up: $1" >&2; exit 2 ;;
    esac
  done

  ensure_cdp_port
  mkdir -p "$AGENT_DIR" "$PROFILE_DIR"

  # Lockfile prevents two concurrent `sandbox.sh up` runs from racing on the
  # same profile dir / CDP port. Atomic mkdir is portable across macOS + Linux
  # without depending on `flock`.
  local LOCKDIR="$AGENT_DIR/.sandbox.lock"
  if ! mkdir "$LOCKDIR" 2>/dev/null; then
    local lock_pid
    lock_pid=$(cat "$LOCKDIR/pid" 2>/dev/null || echo "?")
    if [ -n "$lock_pid" ] && [ "$lock_pid" != "?" ] && kill -0 "$lock_pid" 2>/dev/null; then
      echo "FAIL: another \`sandbox.sh up\` is running (PID $lock_pid). Wait or kill it." >&2
      exit 1
    fi
    echo "[up] Stale lock dir — clearing." >&2
    rm -rf "$LOCKDIR"
    mkdir "$LOCKDIR"
  fi
  echo "$$" > "$LOCKDIR/pid"
  # Expand LOCKDIR at trap-set time (double quotes) so the trap doesn't depend
  # on the local var still being in scope when EXIT fires after `exit $rc`.
  trap "rm -rf \"$LOCKDIR\"" EXIT INT TERM

  # Refuse to overwrite a healthy running sandbox unless --force. A sandbox is
  # "healthy" when launcher.pid is alive AND the CDP port answers.
  if [ "$force" -ne 1 ]; then
    local launcher_pid_file="$AGENT_DIR/launcher.pid"
    local browser_pid_file="$AGENT_DIR/browser.pid"
    local launcher_pid browser_pid
    launcher_pid=$(cat "$launcher_pid_file" 2>/dev/null || true)
    browser_pid=$(cat "$browser_pid_file" 2>/dev/null || true)
    local launcher_alive=0 cdp_alive=0
    [ -n "$launcher_pid" ] && kill -0 "$launcher_pid" 2>/dev/null && launcher_alive=1
    [ -n "$browser_pid" ] && kill -0 "$browser_pid" 2>/dev/null && launcher_alive=1
    if curl -s -m 2 "http://127.0.0.1:${CDP_PORT}/json/version" >/dev/null 2>&1; then
      cdp_alive=1
    fi
    if [ "$launcher_alive" -eq 1 ] && [ "$cdp_alive" -eq 1 ]; then
      echo "Sandbox already running (CDP:${CDP_PORT}, launcher PID ${launcher_pid:-?}, browser PID ${browser_pid:-?})."
      echo "  Reusing existing sandbox. Use --force to relaunch."
      return 0
    fi
    if [ "$launcher_alive" -eq 1 ] || [ "$cdp_alive" -eq 1 ]; then
      echo "[up] Detected partial state (launcher_alive=$launcher_alive, cdp_alive=$cdp_alive) — proceeding to relaunch."
    fi
  fi

  # Auto-start yarn start when no watcher is running and the build is stale.
  if [ ! -f "$EXTENSION_DIR/scripts/app-init.js" ]; then
    if pgrep -f "yarn.* start" >/dev/null 2>&1 || pgrep -f "build:dev dev" >/dev/null 2>&1; then
      echo "[up] Watcher already running — preflight will wait for it."
    else
      local log="$AGENT_DIR/watcher.log"
      echo "[up] No watcher detected — starting \`yarn start\` (log: $log)..."
      ( cd "$REPO" && nohup yarn start >"$log" 2>&1 & )
    fi
  fi

  run_preflight

  if [ ! -f "$WALLET_FIXTURE" ]; then
    echo "FAIL: wallet fixture missing at $WALLET_FIXTURE"
    exit 1
  fi

  # Tee launcher stdout/stderr to a per-run log so failures can be inspected
  # later and `tail -f $AGENT_DIR/*.log` gives parity with mobile's per-stream
  # logs (metro / simulator / wallet).
  LAUNCHER_LOG="$AGENT_DIR/launcher.log"
  : > "$LAUNCHER_LOG"
  echo "[logs] launcher → $LAUNCHER_LOG"
  node "$REPO/test/agentic/setup/launch-sandbox.js" 2>&1 | tee -a "$LAUNCHER_LOG"
  local rc="${PIPESTATUS[0]}"
  rm -rf "$LOCKDIR"
  trap - EXIT INT TERM
  exit "$rc"
}

cmd_down() {
  for pidfile in "$AGENT_DIR/launcher.pid" "$AGENT_DIR/browser.pid"; do
    if [ -f "$pidfile" ]; then
      pid=$(cat "$pidfile" 2>/dev/null || true)
      if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
        echo "[down] killing $(basename "$pidfile") (PID $pid)"
        kill "$pid" 2>/dev/null || true
        # Wait up to 5s for graceful exit, then SIGKILL.
        for _ in 1 2 3 4 5; do
          kill -0 "$pid" 2>/dev/null || break
          sleep 1
        done
        if kill -0 "$pid" 2>/dev/null; then
          echo "[down]   PID $pid did not exit — sending SIGKILL"
          kill -9 "$pid" 2>/dev/null || true
          sleep 1
        fi
      fi
      rm -f "$pidfile"
    fi
  done
  # Belt-and-braces: kill any chromium still bound to our profile dir. Catches
  # child processes the browser PID may have spawned that we don't track.
  # `|| true` guards against pgrep returning non-zero when nothing matches —
  # set -e would otherwise abort cmd_down here.
  if [ -d "$PROFILE_DIR" ]; then
    local stale_pids
    stale_pids=$(pgrep -f "user-data-dir=${PROFILE_DIR}" 2>/dev/null || true)
    if [ -n "$stale_pids" ]; then
      while read -r p; do
        [ -z "$p" ] && continue
        echo "[down] killing stale chromium (PID $p, profile match)"
        kill -9 "$p" 2>/dev/null || true
      done <<< "$stale_pids"
      sleep 1
    fi
  fi
  rm -f "$AGENT_DIR/extension.id" "$AGENT_DIR/fixture-state.json"
  rm -f "$PROFILE_DIR/SingletonLock"
  echo "[down] sandbox cleaned"
}

cmd_clean() {
  local yes=0
  while [[ $# -gt 0 ]]; do
    case "$1" in
      -y|--yes) yes=1; shift ;;
      *) echo "Unknown arg to clean: $1" >&2; exit 2 ;;
    esac
  done

  if [ "$yes" -ne 1 ]; then
    echo "About to delete:"
    echo "  $PROFILE_DIR"
    echo "  $AGENT_DIR/{fixture-state.json,extension.id,*.pid}"
    echo "(wallet fixture and other configs are NOT touched)"
    if [ -t 0 ]; then
      read -r -p "Proceed? [y/N] " ans
      case "$ans" in
        y|Y|yes|YES) ;;
        *) echo "Aborted."; exit 1 ;;
      esac
    else
      echo "FAIL: stdin is not a TTY — pass --yes / -y to skip the prompt." >&2
      exit 1
    fi
  fi

  cmd_down
  if [ -d "$PROFILE_DIR" ]; then
    echo "[clean] removing profile dir $PROFILE_DIR"
    rm -rf "$PROFILE_DIR"
  fi
  echo "[clean] next \`sandbox.sh up\` will start from a fresh profile"
}

cmd_status() {
  ensure_cdp_port
  exec npx tsx "$REPO/test/agentic/status.ts" --cdp-port "$CDP_PORT"
}

cmd_reload() {
  ensure_cdp_port
  exec node "$REPO/test/agentic/soft-refresh.js" --cdp-port "$CDP_PORT"
}

# ---- dispatch ---------------------------------------------------------------
case "${1:-}" in
  up)        shift; cmd_up "$@" ;;
  down)      shift; cmd_down "$@" ;;
  clean)     shift; cmd_clean "$@" ;;
  status)    shift; cmd_status "$@" ;;
  reload)    shift; cmd_reload "$@" ;;
  preflight) shift; run_preflight ;;
  ""|-h|--help)
    sed -n '2,32p' "$0"
    ;;
  *)
    echo "Unknown subcommand: $1" >&2
    echo "Usage: bash test/agentic/sandbox.sh {up|down|clean|status|reload|preflight}" >&2
    exit 2
    ;;
esac
