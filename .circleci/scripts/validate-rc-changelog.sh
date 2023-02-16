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
    printf '%s\n' "No changelog is validated for beta commit $current_commit_msg"
    exit 0
else
    printf '%s\n' "Run validation of changelog for release candidate $version"
    yarn lint:changelog:rc
fi

exit 0
