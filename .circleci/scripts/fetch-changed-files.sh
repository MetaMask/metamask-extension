#!/usr/bin/env bash

set -e
set -u
set -o pipefail

#mkdir tmp

# Fetch the changes from the origin
git fetch

# Store the output of git diff in a temporary file
#git diff --name-only origin/develop..."$CIRCLE_SHA1" >> tmp/changed_files.txt

DIFF_RESULT=$(git diff --name-only origin/develop..."$CIRCLE_SHA1")
echo "$DIFF_RESULT"