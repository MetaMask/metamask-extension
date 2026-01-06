#!/usr/bin/env bash
set -euo pipefail

# Bumps version, runs tests, builds the extension, and generates a changelog entry.

if ! command -v npm >/dev/null 2>&1; then
  echo "npm not installed"
  exit 1
fi

VERSION=$(node -p "require('./package.json').version")
NEXT="$1"

if [ -z "$NEXT" ]; then
  echo "Usage: $0 <next-version>"
  exit 1
fi

npm version "$NEXT" --no-git-tag-version
npm test
npm run build
echo "## $NEXT" > CHANGELOG.tmp
echo "- Bump to $NEXT" >> CHANGELOG.tmp
cat CHANGELOG.md >> CHANGELOG.tmp
mv CHANGELOG.tmp CHANGELOG.md

echo "Prepared release $NEXT. Commit and tag manually."
