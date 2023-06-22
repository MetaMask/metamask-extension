#!/usr/bin/env bash

set -e
set -u
set -o pipefail

# => Version-v10.24.1
version="${CIRCLE_BRANCH/Version-v/}"
current_commit_msg=$(git show -s --format='%s' HEAD)

if [[ $current_commit_msg =~ Version[[:space:]](v[[:digit:]]+.[[:digit:]]+.[[:digit:]]+[-]beta.[[:digit:]]) ]]
then
    # filter the commit message like Version v10.24.1-beta.1
    printf '%s\n' "Create a build for $version with beta version $current_commit_msg"
    export ENABLE_MV3=true
    yarn build --build-type beta --platform='chrome' dist
    yarn build --build-type beta --platform='chrome' prod
else
    printf '%s\n' 'Commit message does not match commit message for beta pattern; skipping beta automation build'
    mkdir dist
    mkdir builds
    exit 0
fi

exit 0
