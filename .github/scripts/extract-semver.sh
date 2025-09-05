#!/bin/bash

set -euo pipefail

ref_name="${GITHUB_REF#refs/heads/}"

# Extract semver based on prefix
if [[ "$ref_name" == Version-v* ]]; then
  semver="${ref_name#Version-v}"
elif [[ "$ref_name" == release/* ]]; then
  semver="${ref_name#release/}"
else
  echo "Error: Branch name must be Version-vX.Y.Z or release/X.Y.Z where X, Y, Z are numbers. Got: $ref_name" >&2
  exit 1
fi
echo "semver=${semver}" >> "$GITHUB_OUTPUT"

# Validate semver format X.Y.Z where X, Y, Z are numbers
if ! [[ "$semver" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "Error: Invalid semver in branch name: $ref_name (extracted: $semver; must be numeric X.Y.Z)" >&2
  exit 1
fi

# Check if hotfix: if patch > 0, skip
patch="${semver##*.}"
if [ "$patch" -gt 0 ]; then
  echo "Hotfix detected (patch $patch > 0), skipping auto-create-release-pr."
  echo "proceed=false" >> "$GITHUB_OUTPUT"
  exit 0
fi

echo "Not a hotfix (patch=0), proceeding."
echo "proceed=true" >> "$GITHUB_OUTPUT"

# Print values passed to call-create-release-pr (note: previous-version-ref computed in reusable workflow)
echo "Inputs to call-create-release-pr:"
echo "  semver-version: ${semver}"
