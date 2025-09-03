#!/bin/bash

FORCE_NEXT_SEMVER_VERSION=$1

# If FORCE_NEXT_SEMVER_VERSION is defined and not empty, use its value and skip the next operations
if [ -n "$FORCE_NEXT_SEMVER_VERSION" ]
then
  echo "NEXT_SEMVER_VERSION=${FORCE_NEXT_SEMVER_VERSION}" >> "$GITHUB_ENV"
  exit 0
fi

# Pattern for Version-vX.Y.Z branches
VERSION_BRANCHES_VERSION_V=$(git branch -r | grep -o 'Version-v[0-9]*\.[0-9]*\.[0-9]*' | grep -o '[0-9]*\.[0-9]*\.[0-9]*' | sort --version-sort | tail -n 1)
# Default pattern for release/x.y.z branches
VERSION_BRANCHES_RELEASE=$(git branch -r | grep -o 'release/[0-9]*\.[0-9]*\.[0-9]*' | grep -o '[0-9]*\.[0-9]*\.[0-9]*' | sort --version-sort | tail -n 1)

# Compare versions and keep the highest one
HIGHEST_VERSION=$(printf "%s\n%s" "$VERSION_BRANCHES_VERSION_V" "$VERSION_BRANCHES_RELEASE" | sort --version-sort | tail -n 1)
echo "HIGHEST_VERSION=${HIGHEST_VERSION}, VERSION_BRANCHES_VERSION_V=${VERSION_BRANCHES_VERSION_V}, VERSION_BRANCHES_RELEASE=${VERSION_BRANCHES_RELEASE}"

# Increment the minor version of the highest version found and reset the patch version to 0
NEXT_VERSION=$(echo "$HIGHEST_VERSION" | awk -F. -v OFS=. '{$2++; $3=0; print}')

echo "NEXT_SEMVER_VERSION=${NEXT_VERSION}" >> "$GITHUB_ENV"
