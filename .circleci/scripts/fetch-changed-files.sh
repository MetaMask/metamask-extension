#!/usr/bin/env bash

set -e
set -u
set -o pipefail

#mkdir tmp

DIFF_RESULT=$(git diff --name-only develop..."$CIRCLE_BRANCH")
echo "$DIFF_RESULT"

# Store the output of git diff in a temporary file
#git diff --name-only origin/develop..."$CIRCLE_SHA1" >> tmp/changed_files.txt
