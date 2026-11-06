#!/bin/bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=.github/scripts/shared/release-version.sh
source "${SCRIPT_DIR}/shared/release-version.sh"

semver="${SEMVER:?SEMVER is required}"
output_file="${GITHUB_OUTPUT:?GITHUB_OUTPUT is required}"

patch="${semver##*.}"
if [ "$patch" -gt 0 ]; then
  echo "Hotfix release/${semver}. Opening the release pull request."
  echo "proceed=true" >> "$output_file"
  exit 0
fi

head_sha="$(git rev-parse HEAD)"
descendants="$(git rev-list --first-parent --reverse --ancestry-path "${head_sha}..origin/main")"
next="${descendants%%$'\n'*}"

if [ -n "$next" ] &&
  [ "$(git rev-parse "${next}^1")" = "$head_sha" ] &&
  [ "$(package_version_at "$head_sha")" = "$semver" ] &&
  is_release_bump "$semver" "$(package_version_at "$next")"; then
  echo "release/${semver} is the commit before the version bump in ${next}. Opening the release pull request."
  echo "proceed=true" >> "$output_file"
else
  echo "release/${semver} is not the commit before a version bump on main. Not opening a release pull request."
  echo "proceed=false" >> "$output_file"
fi
