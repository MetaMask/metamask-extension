#!/usr/bin/env bash
# validate-recipe.sh — Run a recipe against MetaMask Extension
# Usage: bash validate-recipe.sh <recipe.json> [--dry-run] [--step] [--slow <ms>] [--skip-manual] [--param key=val]
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RECIPE="${1:?Usage: validate-recipe.sh <recipe.json> [options]}"
shift

SANDBOX_ENV="${SANDBOX_ENV:-$SCRIPT_DIR/.env}"
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

exec node "$SCRIPT_DIR/validate-recipe.js" --recipe "$RECIPE" "$@"
