#!/usr/bin/env bash

set -e
set -u
set -o pipefail

# => Version-v10.24.1
version="${CIRCLE_BRANCH/Version-v/}"
current_commit_msg=$(git show -s --format='%s' HEAD)
build_version="echo $current_commit_msg | cut -d \beta -f 2"
printf '%s\n' "Creating the prod beta build for $version with beta version $build_version"
yarn build --build-type beta --build-version "${build_version}" prod

#if [[ $current_commit_msg =~ Version[-[:space:]](v[[:digit:]]+.[[:digit:]]+.[[:digit:]]+[-]beta.[[:digit:]]) ]]
#then
#    build_version="echo $current_commit_msg | cut -d \beta -f 2"
#    yarn build --build-type beta --build-version "${build_version}" prod
#    printf '%s\n' "Creating the prod beta build for $version with beta version build_version"
#
#else
#  # filter the commit message like Version v10.24.1-beta.1
#    printf '%s\n' 'Commit message does not match commit message for beta pattern; skipping beta automation build'
#    exit 0
#fi

exit 0
