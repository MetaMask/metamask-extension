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

version="${CIRCLE_BRANCH/Version-v/}"
yarn version --no-git-tag-version --new-version "${version}"

if [[ -z $(git status --porcelain) ]]
then
    printf '%s\n' 'App manifest version already set'
fi
