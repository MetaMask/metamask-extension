#!/bin/bash
set -euo pipefail

# Repo-local convenience wrapper.
# From inside a synced slot repo, this reopens the prepared browser for the
# current slot with the correct inferred arguments.

FARMSLOT_DIR="/Users/deeeed/dev/farmslot"

exec bash "${FARMSLOT_DIR}/scripts/reopen-slot-browser.sh" "$@"
