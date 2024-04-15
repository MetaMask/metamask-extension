#!/usr/bin/env bash

set -e
set -o pipefail

IS_NON_FORK_DRAFT='false'

if [[ -n $CIRCLE_PULL_REQUEST ]] && gh auth status
then
  PR_NUMBER="${CIRCLE_PULL_REQUEST##*/}"
  if [ -n "$PR_NUMBER" ]
  then
    IS_NON_FORK_DRAFT="$(gh pr view --json isDraft --jq '.isDraft' "$PR_NUMBER")"
  fi
fi

# Build query to see whether there are any "preview-like" packages in the manifest
# A "preview-like" package is a `@metamask`-scoped package with a prerelease version that has no period.
QUERY='.dependencies + .devDependencies'                            # Get list of all dependencies
QUERY+=' | with_entries( select(.key | startswith("@metamask") ) )' # filter to @metamask-scoped packages
QUERY+=' | to_entries[].value'                                      # Get version ranges
QUERY+=' | select(test("^\\d+\\.\\d+\\.\\d+-[^.]+$"))'              # Get pinned versions where the prerelease part has no "."

# Use `-e` flag so that exit code indicates whether any matches were found
if jq -e "${QUERY}" < ./package.json
then
  echo "Preview builds detected"
  HAS_PREVIEW_BUILDS='true'
else
  echo "No preview builds detected"
  HAS_PREVIEW_BUILDS='false'
fi

if [[ $IS_NON_FORK_DRAFT == 'true' && $HAS_PREVIEW_BUILDS == 'true' ]]
then
  # Use GitHub registry on draft PRs, allowing the use of preview builds
  echo "Installing with preview builds"
  METAMASK_NPM_REGISTRY=https://npm.pkg.github.com yarn --immutable
else
  echo "Installing without preview builds"
  yarn --immutable
fi
