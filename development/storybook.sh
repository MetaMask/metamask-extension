#!/usr/bin/env bash

set -e
set -u
set -x

# capture yarn build output
STORYBOOK_OUTPUT=$(yarn storybook:build 2>&1)
# check for export warnings
OUTPUT=$(echo "$STORYBOOK_OUTPUT" | grep 'WARN' | grep 'export')
if [ -n "$OUTPUT" ]; then
  # fail if there's any output
  echo "Looks like something in storybook wasn't exported properly!"
  exit 1
fi
