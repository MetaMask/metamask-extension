#!/bin/bash

FORCE_NEXT_SEMVER_VERSION=$1

# If FORCE_NEXT_SEMVER_VERSION is defined and not empty, use its value and skip the next operations
if [ -n "$FORCE_NEXT_SEMVER_VERSION" ]
then
  echo "NEXT_SEMVER_VERSION=${FORCE_NEXT_SEMVER_VERSION}" >> "$GITHUB_ENV"
  exit 0
fi

# Get the version from package.json
VERSION_PACKAGE=$(node -p "require(process.env.GITHUB_WORKSPACE + '/package.json').version")

echo "NEXT_SEMVER_VERSION=${VERSION_PACKAGE}" >> "$GITHUB_ENV"
