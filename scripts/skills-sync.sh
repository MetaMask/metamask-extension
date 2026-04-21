#!/usr/bin/env bash
# skills-sync.sh — sync agent skills from the configured upstream repo.
#
# Reads source and ref from .skills/CONFIG. All other flags are passed
# through to the upstream sync.sh.
#
# Usage:
#   bash scripts/skills-sync.sh [extra sync.sh flags]
#
# To pin to a specific tag without editing CONFIG:
#   bash scripts/skills-sync.sh --ref v2026.04.20

set -euo pipefail

CONFIG=".skills/CONFIG"
[[ ! -f "$CONFIG" ]] && { echo "Error: $CONFIG not found. Are you in the repo root?" >&2; exit 1; }

REPO=$(grep ^skills_repo "$CONFIG" | cut -d= -f2 | tr -d '[:space:]')
REF=$(grep  ^skills_ref  "$CONFIG" | cut -d= -f2 | tr -d '[:space:]')

[[ -z "$REPO" ]] && { echo "Error: skills_repo not set in $CONFIG" >&2; exit 1; }
[[ -z "$REF"  ]] && REF="main"

# Derive raw-content base URL from the clone URL.
# Handles github.com HTTPS URLs: https://github.com/ORG/REPO.git
RAW_BASE=$(echo "$REPO" | sed -E 's|https://github.com/([^/]+)/([^.]+)(\.git)?|https://raw.githubusercontent.com/\1/\2|')

echo "Syncing from ${REPO} (ref=${REF}) ..."
bash <(curl -fsSL "${RAW_BASE}/${REF}/tools/sync.sh") \
  --target . \
  --ref "$REF" \
  --no-symlinks \
  "$@"
