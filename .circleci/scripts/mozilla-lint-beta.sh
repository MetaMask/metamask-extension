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
    printf '%s\n' "Linting beta builds for firefox"
    # Move beta build to dist
    mv ./dist-beta ./dist
    # Move beta zips to builds
    mv ./builds-beta ./builds
    # test:mozilla-lint
    NODE_OPTIONS=--max_old_space_size=3072
    yarn mozilla-lint
else
    printf '%s\n' 'Commit message does not match commit message for beta pattern; skipping linting for firefox'
    mkdir dist
    mkdir builds
    exit 0
fi

exit 0
