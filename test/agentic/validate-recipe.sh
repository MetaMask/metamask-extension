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

# Make wallet-fixture.json fields available as env tokens (e.g.
# {{env.WALLET_PASSWORD}}) for templated flow input defaults. Only sets
# WALLET_PASSWORD when not already exported, so a manual override wins.
WALLET_FIXTURE="${WALLET_FIXTURE:-$SCRIPT_DIR/../../temp/runtime/wallet-fixture.json}"
if [ -z "${WALLET_PASSWORD:-}" ] && [ -f "$WALLET_FIXTURE" ] && command -v jq >/dev/null 2>&1; then
  _pw="$(jq -r '.password // empty' "$WALLET_FIXTURE" 2>/dev/null || true)"
  [ -n "$_pw" ] && export WALLET_PASSWORD="$_pw"
  unset _pw
fi

exec node "$SCRIPT_DIR/validate-recipe.js" --recipe "$RECIPE" "$@"
