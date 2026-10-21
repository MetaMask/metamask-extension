#!/bin/bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "${SCRIPT_DIR}/release-version.sh"

merge_sha="${MERGE_COMMIT_SHA:?MERGE_COMMIT_SHA is required}"
head_ref="${VERSION_BUMP_HEAD:?VERSION_BUMP_HEAD is required}"
output_file="${GITHUB_OUTPUT:?GITHUB_OUTPUT is required}"

write_output() {
  echo "semver=${1}" >> "$output_file"
  echo "cut=${2}" >> "$output_file"
}

bump_version="${head_ref#version-bump/}"
if [ "$head_ref" = "$bump_version" ] || ! is_numeric_semver "$bump_version"; then
  echo "Head ref ${head_ref} is not version-bump/X.Y.Z. Not cutting a release branch."
  write_output "" "false"
  exit 0
fi

if ! git rev-parse --verify --quiet "${merge_sha}^1" >/dev/null; then
  git fetch --depth=2 origin "$merge_sha"
fi
parent="$(git rev-parse "${merge_sha}^1")"
parent_version="$(git show "${parent}:package.json" | package_version_from_json)"
merge_version="$(git show "${merge_sha}:package.json" | package_version_from_json)"

if ! expected="$(next_minor_version "$parent_version")"; then
  echo "Parent version ${parent_version} is not X.Y.0. Not cutting a release branch."
  write_output "" "false"
  exit 0
fi

if [ "$merge_version" != "$expected" ] || [ "$head_ref" != "version-bump/${merge_version}" ]; then
  echo "Version bump ${parent_version} -> ${merge_version} on ${head_ref} is not the minor bump to ${expected}. Not cutting a release branch."
  write_output "" "false"
  exit 0
fi

release_branch="release/${parent_version}"
echo "Cutting ${release_branch} at ${parent}"

if ! git push origin "${parent}:refs/heads/${release_branch}"; then
  echo "Failed to create ${release_branch} at ${parent}. The branch may already point somewhere else." >&2
  exit 1
fi

write_output "$parent_version" "true"
echo "Cut ${release_branch}"
