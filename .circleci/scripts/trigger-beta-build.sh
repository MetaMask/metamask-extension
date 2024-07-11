#!/usr/bin/env bash

set -x
set -e
set -u
set -o pipefail

# => Version-v10.24.1
current_commit_msg=$(git show -s --format='%s' HEAD)

# filter the commit message like Version v10.24.1-beta.1
printf '%s\n' "Create a build for 12 with beta version $current_commit_msg"
yarn build --build-type beta --platform='chrome' dist
yarn build --build-type beta --platform='chrome' prod


exit 0
