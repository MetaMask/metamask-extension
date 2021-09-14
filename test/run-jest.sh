#!/usr/bin/env bash

set -x
set -e
set -u
set -o pipefail

# For storing PIDs of subshells
PIDS=(0 0)

yarn 'jest' '--config=./jest.config.js' "$@" & PIDS[0]=$!
yarn 'jest' '--config=./development/jest.config.js' "$@" & PIDS[1]=$!

# This ensures that this shell exists with a non-zero code if any of the
# subshells we waited for did
for pid in "${PIDS[@]}"; do
    wait "$pid"
done
