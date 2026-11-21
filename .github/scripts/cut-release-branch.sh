#!/bin/bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=.github/scripts/shared/release-version.sh
source "${SCRIPT_DIR}/shared/release-version.sh"

before_sha="${BEFORE_SHA:?BEFORE_SHA is required}"
after_sha="${AFTER_SHA:?AFTER_SHA is required}"

# A merge queue batch can land several commits in one push, so check every
# commit in the push that touched package.json, not only the last one.
commits="$(git rev-list --first-parent --reverse "${before_sha}..${after_sha}" -- package.json)"

cut_count=0
for commit in $commits; do
  parent="$(git rev-parse "${commit}^1")"
  old_version="$(package_version_at "$parent")"
  new_version="$(package_version_at "$commit")"
  if ! is_release_bump "$old_version" "$new_version"; then
    continue
  fi

  release_branch="release/${old_version}"
  existing="$(git ls-remote --heads origin "refs/heads/${release_branch}" | cut -f1)"
  if [ "$existing" = "$parent" ]; then
    echo "${release_branch} already points at ${parent}. Nothing to do."
  elif [ -n "$existing" ]; then
    echo "${release_branch} already exists at ${existing}, not at ${parent}, the commit before the bump to ${new_version}. Delete it, then re-run this workflow." >&2
    exit 1
  else
    echo "Cutting ${release_branch} at ${parent}, the commit before the bump to ${new_version} in ${commit}."
    git push origin "${parent}:refs/heads/${release_branch}"
  fi
  cut_count=$((cut_count + 1))
done

if [ "$cut_count" -eq 0 ]; then
  echo "No version bump from X.Y.0 in ${before_sha}..${after_sha}. Not cutting a release branch."
fi
