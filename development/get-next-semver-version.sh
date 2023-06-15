#!/bin/bash

FORCE_NEXT_SEMVER_VERSION=$1

# Get the highest version from release branches
VERSION_BRANCHES=$(git branch -r | grep -o 'release/[0-9]*\.[0-9]*\.[0-9]*' | grep -o '[0-9]*\.[0-9]*\.[0-9]*' | sort --version-sort | tail -n 1)

# Get the highest version from tags
VERSION_TAGS=$(git tag | grep -o 'v[0-9]*\.[0-9]*\.[0-9]*' | grep -o '[0-9]*\.[0-9]*\.[0-9]*' | sort --version-sort | tail -n 1)

# Get the version from package.json
VERSION_PACKAGE=$(node -p "require('./package.json').version")

# Compare versions and keep the highest one
HIGHEST_VERSION=$(printf "%s\n%s\n%s" "$VERSION_BRANCHES" "$VERSION_TAGS" "$VERSION_PACKAGE" | sort --version-sort | tail -n 1)

# Increment the minor version of the highest version found
NEXT_VERSION=$(echo "$HIGHEST_VERSION" | awk -F. -v OFS=. '{$2++; print}')

# Check if FORCE_NEXT_SEMVER_VERSION is defined and not empty
if [ -n "$FORCE_NEXT_SEMVER_VERSION" ]
then
  NEXT_VERSION=$FORCE_NEXT_SEMVER_VERSION
fi

echo "NEXT_SEMVER_VERSION=${NEXT_VERSION}" >> "$GITHUB_ENV"
