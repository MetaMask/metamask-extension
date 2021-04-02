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
updated_manifest="$(jq ".version = \"$version\"" app/manifest/_base.json)"
printf '%s\n' "$updated_manifest" > app/manifest/_base.json
yarn prettier --write app/manifest/_base.json

if [[ -z $(git status --porcelain) ]]
then
    printf '%s\n' 'App manifest version already set'
fi
