#!/bin/bash
#
# Resolves the semver for Stable Branch Sync PRs. Uses the version at the tip
# of `stable` (from package.json), i.e. the release that was just merged — not
# the "next" release derived from remote release/* branches (see
# get-next-semver-version.sh for that).

set -euo pipefail

if [ -z "${GITHUB_OUTPUT:-}" ]; then
  echo "GITHUB_OUTPUT is not set; this script is only meant to run in GitHub Actions." >&2
  exit 1
fi

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
PACKAGE_JSON="${ROOT}/package.json"

if [ ! -f "$PACKAGE_JSON" ]; then
  echo "Expected package.json at ${PACKAGE_JSON}" >&2
  exit 1
fi

VERSION=$(jq -r '.version | select(type == "string")' "$PACKAGE_JSON")

if [ -z "$VERSION" ] || [ "$VERSION" = "null" ]; then
  echo "Could not read .version from ${PACKAGE_JSON}" >&2
  exit 1
fi

# Same rule as .github/scripts/shared/utils.mts isValidVersionFormat (stable-sync branch names expect x.y.z).
if ! [[ "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "Invalid version in ${PACKAGE_JSON}: ${VERSION} (expected numeric x.y.z)" >&2
  exit 1
fi

echo "stable_version=${VERSION}" >> "$GITHUB_OUTPUT"
