#!/usr/bin/env bash

set -e
set -u
set -o pipefail

#mkdir tmp
echo "Last 10 commits current branch:"
LOG=$(git log --oneline -n 10 "$CIRCLE_BRANCH")
echo "$LOG"

echo "Last 10 commits develop:"
LOG=$(git log --oneline -n 10 origin/develop)
echo "$LOG"

DIFF_RESULT=$(git diff --name-only origin/develop..."$CIRCLE_BRANCH")
echo "$DIFF_RESULT"

# Store the output of git diff in a temporary file
git diff --name-only origin/develop..."$CIRCLE_SHA1" >> changed-files/changed-files.txt

exit 0
