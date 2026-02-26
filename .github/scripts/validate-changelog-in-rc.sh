#!/usr/bin/env bash

set -e
set -u
set -o pipefail

current_commit_msg=$(git show -s --format='%s' HEAD)

if [[ "${current_commit_msg}" =~ Version[[:space:]](v[[:digit:]]+.[[:digit:]]+.[[:digit:]]+[-]beta.[[:digit:]]) ]]; then
  printf '%s\n' 'Skip changelog validation for beta commit'
else
  printf '%s\n' 'Validate changelog for release candidate'
  yarn lint:changelog:rc
fi

exit 0
