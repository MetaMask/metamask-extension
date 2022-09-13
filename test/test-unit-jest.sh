#!/usr/bin/env bash

set -x
set -e
set -u
set -o pipefail

concurrently -n production,development \
  "jest --config=./jest.config.js $*" \
  "jest --config=./development/jest.config.js $*"
