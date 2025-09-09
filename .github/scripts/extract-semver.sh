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

# Determine if hotfix (patch > 0). Hotfixes are now supported and should proceed.
patch="${semver##*.}"
if [ "$patch" -gt 0 ]; then
  echo "Hotfix detected (patch $patch > 0), proceeding with auto-create-release-pr."
else
  echo "Not a hotfix (patch=0), proceeding."
fi

# Print values passed to call-create-release-pr (note: previous-version-ref computed in reusable workflow)
echo "Inputs to call-create-release-pr:"
echo "  semver-version: ${semver}"
