#!/usr/bin/env bash
# validate-recipe.sh — Run a recipe against MetaMask Extension
# Usage: bash validate-recipe.sh <recipe.json> [--dry-run] [--step] [--slow <ms>] [--skip-manual] [--param key=val]
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RECIPE="${1:?Usage: validate-recipe.sh <recipe.json> [options]}"
shift

exec node "$SCRIPT_DIR/validate-recipe.js" --recipe "$RECIPE" "$@"
