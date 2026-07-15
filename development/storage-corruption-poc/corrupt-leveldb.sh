#!/usr/bin/env bash
#
# TEMPORARY storage-corruption investigation tool (do not ship).
#
# MetaMask persists its real state (vault + controller state) to
# chrome.storage.local, which Chrome backs with a LevelDB database on disk.
# The "storage corrupted/missing/damaged" bug reports are corruption of THAT
# database, not of chrome.storage.session and not of an in-flight set() call.
#
# You cannot reproduce this by killing the service worker (a single set() is
# committed atomically by the browser process, off the SW JS thread). You CAN
# reproduce it by damaging the LevelDB files directly, which is what an OS
# crash, power loss during compaction, bad sector, or aborted fsync effectively
# does. This script does that in a controlled way so you can then observe how
# ExtensionStore.get() / PersistenceManager.get() and the vault-recovery path
# behave.
#
# USAGE:
#   1. Fully QUIT Chrome (not just close the window). LevelDB holds a lock and
#      buffers writes in memory; tampering while Chrome runs proves nothing.
#   2. ./corrupt-leveldb.sh <extension-id> [mode]
#        mode = manifest | ldb | truncate | wipe-current   (default: ldb)
#   3. Reopen Chrome, open MetaMask, watch the service-worker console.
#
# A timestamped backup of the whole LevelDB directory is taken first so you can
# restore with:  ./corrupt-leveldb.sh restore <extension-id>
#
# Only tested on macOS/Linux Chrome "Default" profile. Override the profile with
# PROFILE_DIR_OVERRIDE=".../Profile 1" for other profiles/channels.

set -euo pipefail

# --- locate the storage directory -----------------------------------------

case "$(uname -s)" in
  Darwin)
    PROFILE_DIR="${HOME}/Library/Application Support/Google/Chrome/Default"
    ;;
  Linux)
    PROFILE_DIR="${HOME}/.config/google-chrome/Default"
    ;;
  *)
    echo "Unsupported OS. Set PROFILE_DIR_OVERRIDE manually." >&2
    exit 1
    ;;
esac

PROFILE_DIR="${PROFILE_DIR_OVERRIDE:-$PROFILE_DIR}"

usage() {
  echo "Usage: $0 <extension-id> [manifest|ldb|truncate|wipe-current]" >&2
  echo "       $0 restore <extension-id>" >&2
  echo "       $0 list" >&2
  exit 1
}

[ $# -ge 1 ] || usage

# --- list mode: help find the extension id ---------------------------------

if [ "$1" = "list" ]; then
  echo "Extensions with a Local Extension Settings LevelDB under:"
  echo "  ${PROFILE_DIR}/Local Extension Settings"
  ls -1 "${PROFILE_DIR}/Local Extension Settings" 2>/dev/null || \
    echo "  (none found)"
  exit 0
fi

# --- restore mode ----------------------------------------------------------

if [ "$1" = "restore" ]; then
  [ $# -eq 2 ] || usage
  EXT_ID="$2"
  DB_DIR="${PROFILE_DIR}/Local Extension Settings/${EXT_ID}"
  LATEST_BACKUP=$(ls -1dt "${DB_DIR}".backup.* 2>/dev/null | head -n1 || true)
  if [ -z "${LATEST_BACKUP}" ]; then
    echo "No backup found for ${EXT_ID}" >&2
    exit 1
  fi
  rm -rf "${DB_DIR}"
  cp -R "${LATEST_BACKUP}" "${DB_DIR}"
  echo "Restored ${DB_DIR} from ${LATEST_BACKUP}"
  exit 0
fi

# --- corrupt mode ----------------------------------------------------------

EXT_ID="$1"
MODE="${2:-ldb}"
DB_DIR="${PROFILE_DIR}/Local Extension Settings/${EXT_ID}"

if [ ! -d "${DB_DIR}" ]; then
  echo "LevelDB dir not found: ${DB_DIR}" >&2
  echo "Run '$0 list' to see available extension ids." >&2
  exit 1
fi

# Refuse to run if Chrome still holds the LevelDB lock.
if [ -f "${DB_DIR}/LOCK" ] && command -v lsof >/dev/null 2>&1; then
  if lsof "${DB_DIR}/LOCK" >/dev/null 2>&1; then
    echo "Chrome appears to still hold ${DB_DIR}/LOCK. Quit Chrome first." >&2
    exit 1
  fi
fi

STAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP="${DB_DIR}.backup.${STAMP}"
cp -R "${DB_DIR}" "${BACKUP}"
echo "Backed up to ${BACKUP}"

corrupt_manifest() {
  # LevelDB refuses to open if the MANIFEST is unreadable -> get() throws ->
  # PersistenceManager treats it as InaccessibleDatabase and attempts recovery
  # from the IndexedDB backup.
  local manifest
  manifest=$(ls -1 "${DB_DIR}"/MANIFEST-* 2>/dev/null | head -n1 || true)
  [ -n "${manifest}" ] || { echo "No MANIFEST found" >&2; exit 1; }
  dd if=/dev/urandom of="${manifest}" bs=1 count=64 seek=16 conv=notrunc \
    status=none
  echo "Corrupted MANIFEST: ${manifest}"
}

corrupt_ldb() {
  # Flip bytes inside a .ldb table file. Depending on where the vault lives,
  # this yields either a read error or silently missing/garbled keys.
  local table
  table=$(ls -1 "${DB_DIR}"/*.ldb 2>/dev/null | head -n1 || true)
  if [ -z "${table}" ]; then
    echo "No .ldb table files yet (data may still be in the .log WAL)."
    table=$(ls -1 "${DB_DIR}"/*.log 2>/dev/null | head -n1 || true)
    [ -n "${table}" ] || { echo "No .ldb or .log files found" >&2; exit 1; }
    echo "Falling back to WAL file: ${table}"
  fi
  dd if=/dev/urandom of="${table}" bs=1 count=128 seek=32 conv=notrunc \
    status=none
  echo "Corrupted table/WAL: ${table}"
}

corrupt_truncate() {
  # Simulate an interrupted fsync / power loss mid-write: truncate the newest
  # .log (write-ahead log) so the tail of the last transaction is lost.
  local wal
  wal=$(ls -1t "${DB_DIR}"/*.log 2>/dev/null | head -n1 || true)
  [ -n "${wal}" ] || { echo "No .log WAL found" >&2; exit 1; }
  local size
  size=$(wc -c < "${wal}")
  local newsize=$(( size / 2 ))
  if command -v truncate >/dev/null 2>&1; then
    truncate -s "${newsize}" "${wal}"
  else
    dd if="${wal}" of="${wal}.tmp" bs=1 count="${newsize}" status=none
    mv "${wal}.tmp" "${wal}"
  fi
  echo "Truncated WAL ${wal} from ${size} to ${newsize} bytes"
}

wipe_current() {
  # CURRENT points at the live MANIFEST. Emptying it makes LevelDB unable to
  # find its manifest at all -> hard open failure.
  : > "${DB_DIR}/CURRENT"
  echo "Emptied ${DB_DIR}/CURRENT"
}

case "${MODE}" in
  manifest)     corrupt_manifest ;;
  ldb)          corrupt_ldb ;;
  truncate)     corrupt_truncate ;;
  wipe-current) wipe_current ;;
  *)            usage ;;
esac

echo
echo "Done. Reopen Chrome + MetaMask and watch the service-worker console."
echo "Restore anytime with: $0 restore ${EXT_ID}"
