#!/bin/bash

set -euo pipefail

is_numeric_semver() {
  [[ "${1:-}" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]
}

package_version_from_json() {
  python3 -c 'import json,sys; print(json.load(sys.stdin)["version"])'
}

next_minor_version() {
  local version="$1"
  if ! is_numeric_semver "$version"; then
    echo "Invalid semver: ${version:-<empty>}" >&2
    return 1
  fi

  local major minor patch
  IFS=. read -r major minor patch <<< "$version"
  if [ "$patch" -ne 0 ]; then
    echo "Version ${version} is not a minor release (patch must be 0)." >&2
    return 1
  fi

  echo "${major}.$((minor + 1)).0"
}

merge_sha="${MERGE_COMMIT_SHA:?MERGE_COMMIT_SHA is required}"
output_file="${GITHUB_OUTPUT:?GITHUB_OUTPUT is required}"

write_output() {
  echo "semver=${1}" >> "$output_file"
  echo "cut=${2}" >> "$output_file"
}

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

if [ "$merge_version" != "$expected" ]; then
  echo "Version bump ${parent_version} -> ${merge_version} is not the minor bump to ${expected}. Not cutting a release branch."
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
