#!/usr/bin/env bash

set -e
set -u
set -o pipefail

if [[ "${CI:-}" != 'true' ]]
then
    printf '%s\n' 'CI environment variable must be set to true'
    exit 1
fi

if [[ "${CIRCLECI:-}" != 'true' ]]
then
    printf '%s\n' 'CIRCLECI environment variable must be set to true'
    exit 1
fi

printf '%s\n' 'Updating the manifest version if needed'

current_commit_msg=$(git show -s --format='%s' HEAD)
if [[ $current_commit_msg =~ Version[[:space:]](v[[:digit:]]+.[[:digit:]]+.[[:digit:]]+[-]beta.[[:digit:]]) ]]
then
  printf '%s\n' 'manifest version will not be updated for beta commit'
  # escape version update everytime a new change pushed to release branch
else
  version="${CIRCLE_BRANCH/Version-v/}"
  yarn version "${version}"
fi

if [[ -z $(git status --porcelain) ]]
then
    printf '%s\n' 'App manifest version already set'
fi
