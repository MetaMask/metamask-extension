#!/bin/bash
# Count circular dependency cycles from development/circular-deps.jsonc
# Usage: ./scripts/count-circular-deps.sh (run from mm-extension root)
# Run after: yarn circular-deps:update
# Outputs: single integer (cycle count)

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"

FILE="development/circular-deps.jsonc"
if [[ ! -f "$FILE" ]]; then
  echo "Error: $FILE not found. Run yarn circular-deps:update first." >&2
  exit 1
fi

node -e "
const fs = require('fs');
const content = fs.readFileSync('$FILE', 'utf8');
const json = content.split('\n').filter(l => !l.trim().startsWith('//')).join('\n');
const arr = JSON.parse(json);
console.log(Array.isArray(arr) ? arr.length : 0);
"
