#!/usr/bin/env bash
set -euo pipefail

# Bundle all vat sources under app/offscreen/ocap-kernel/vats/
# using the ocap-kernel CLI. Bundles are written next to the source
# (e.g. index.ts -> index.bundle) and copied to dist by webpack.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
VATS_DIR="$ROOT_DIR/app/offscreen/ocap-kernel/vats"

# Path to the ocap-kernel CLI bundler
OCAP_CLI="${OCAP_CLI:-ocap-kernel/packages/cli/dist/app.mjs}"

if [ ! -f "$OCAP_CLI" ]; then
  echo "Error: ocap-kernel CLI not found at $OCAP_CLI"
  echo "Set OCAP_CLI env var to the correct path."
  exit 1
fi

if [ ! -d "$VATS_DIR" ]; then
  echo "No vats directory found at $VATS_DIR"
  exit 0
fi

for vat_dir in "$VATS_DIR"/*/; do
  if [ ! -d "$vat_dir" ]; then
    continue
  fi

  vat_name="$(basename "$vat_dir")"
  entry_file="$vat_dir/index.ts"

  if [ ! -f "$entry_file" ]; then
    echo "Skipping $vat_name: no index.ts found"
    continue
  fi

  echo "Bundling vat: $vat_name"
  node "$OCAP_CLI" bundle "$entry_file"
done

echo "Vat bundling complete."
