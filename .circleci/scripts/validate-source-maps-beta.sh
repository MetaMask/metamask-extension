#!/usr/bin/env bash

set -e
set -u
set -o pipefail

# => Version-v10.24.1
current_commit_msg=$(git show -s --format='%s' HEAD)

if [[ $current_commit_msg =~ Version[[:space:]](v[[:digit:]]+.[[:digit:]]+.[[:digit:]]+[-]beta.[[:digit:]]) ]]
then
    # filter the commit message like Version v10.24.1-beta.1
	mv ./dist-beta ./dist
	mv ./builds-beta ./builds
    printf '%s\n' "Validate source maps with beta version $current_commit_msg"
    yarn validate-source-maps
else
    printf '%s\n' 'Commit message does not match commit message for beta pattern; skipping validation of beta source maps'
    exit 0
fi

exit 0
