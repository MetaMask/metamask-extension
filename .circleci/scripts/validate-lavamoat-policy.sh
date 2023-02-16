#!/usr/bin/env bash

set -e
set -u
set -o pipefail

current_commit_msg=$(git show -s --format='%s' HEAD)

if [[ $current_commit_msg =~ Version[[:space:]](v[[:digit:]]+.[[:digit:]]+.[[:digit:]]+[-]beta.[[:digit:]]) ]]
then
    printf '%s\n' 'Skip LavaMoat policy for beta commit'
else
    printf '%s\n' 'Validate lavaMoat policy for release build'
    yarn lavamoat:auto:ci
fi

if git diff --exit-code
then
  echo "LavaMoat policy is up-to-date"
else
  echo "LavaMoat policy requires updates"
  exit 1
fi
