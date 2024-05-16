#!/usr/bin/env bash

set -e
set -u
set -o pipefail

mkdir tmp

# Fetch the changes from the origin
git fetch origin

# Store the output of git diff in a temporary file
git diff --name-only origin/develop...$CIRCLE_SHA1 >> tmp/changed_files.txt
