#!/usr/bin/env bash

set -e
set -u
set -o pipefail

#mkdir tmp

# Fetch the changes from the origin
FETCH_RESULT = $(git fetch)
echo "$FETCH_RESULT"

DIFF_RESULT=$(git diff --name-only develop..."$CIRCLE_SHA1")
echo "$DIFF_RESULT"

# Store the output of git diff in a temporary file
#git diff --name-only origin/develop..."$CIRCLE_SHA1" >> tmp/changed_files.txt
