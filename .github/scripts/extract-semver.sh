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

# Validate semver format X.Y.Z where X, Y, Z are numbers
if ! [[ "$semver" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "Error: Invalid semver in branch name: $ref_name (extracted: $semver; must be numeric X.Y.Z)" >&2
  exit 1
fi

echo "  semver-version: ${semver}"
echo "semver=${semver}" >> "$GITHUB_OUTPUT"
