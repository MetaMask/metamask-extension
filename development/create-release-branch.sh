#!/usr/bin/env bash

set -e
set -u
set -o pipefail

NEW_VERSION="${1}"
RELEASE_BRANCH_PREFIX="Version-v"

if [[ -z $NEW_VERSION ]]; then
  echo "Error: No new version specified."
  exit 1
fi

RELEASE_BRANCH_NAME="${RELEASE_BRANCH_PREFIX}${NEW_VERSION}"

git config user.name metamaskbot
git config user.email metamaskbot@users.noreply.github.com

git checkout -b "${RELEASE_BRANCH_NAME}"

git add . && git commit --allow-empty -m "${NEW_VERSION}"

git push --set-upstream origin "${RELEASE_BRANCH_NAME}"
