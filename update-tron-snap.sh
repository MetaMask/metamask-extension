#!/bin/bash

# Script to sync local Tron snap to MetaMask extension
# Run this script after running yarn install or whenever you rebuild your snap

set -e

SNAP_SOURCE="/Users/julienfontanel/Documents/Dev/Consensys/snap-tron-wallet/packages/snap/dist"
SNAP_DEST="./node_modules/@metamask/tron-wallet-snap/dist"

echo "🔄 Syncing Tron snap from local repository..."

# Check if source directory exists
if [ ! -d "$SNAP_SOURCE" ]; then
  echo "❌ Error: Source directory not found: $SNAP_SOURCE"
  echo "   Make sure you've built your snap first!"
  exit 1
fi

# Check if destination directory exists
if [ ! -d "$SNAP_DEST" ]; then
  echo "❌ Error: Destination directory not found: $SNAP_DEST"
  echo "   Make sure you've run 'yarn install' first!"
  exit 1
fi

# Remove old files first
echo "   Removing old bundle.js..."
rm -f "$SNAP_DEST/bundle.js"

echo "   Removing old preinstalled-snap.json..."
rm -f "$SNAP_DEST/preinstalled-snap.json"

# Copy the new files
echo "   Copying bundle.js..."
cp "$SNAP_SOURCE/bundle.js" "$SNAP_DEST/bundle.js"

echo "   Copying preinstalled-snap.json..."
cp "$SNAP_SOURCE/preinstalled-snap.json" "$SNAP_DEST/preinstalled-snap.json"

echo "✅ Tron snap synced successfully!"
echo ""
echo "📝 Next steps:"
echo "   - If the extension is already running, it should auto-reload"
echo "   - If not, run: yarn start"
