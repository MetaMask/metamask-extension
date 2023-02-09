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

# => Version-v10.24.1
version="${CIRCLE_BRANCH/Version-v/}"

# collect commit message
current_commit_msg=$(git show -s --format='%s' HEAD)

# filter the commit message like Version v10.24.1-beta.1
if [[ $current_commit_msg =~ Version[-[:space:]](v[[:digit:]]+.[[:digit:]]+.[[:digit:]]+[-]beta.[[:digit:]]) ]]
then
    yarn build --build-type beta prod
    printf '%s\n' "Creating the prod beta build for $version"

else
  # filter the commit message like Version v10.24.1-beta.1
    printf '%s\n' 'Commit message does not match commit message for beta pattern; skipping beta automation build'
    exit 0
fi
