#!/usr/bin/env bash

set -x
set -e
set -u
set -o pipefail

concurrently --raw -n mocha,jest,global \
  "yarn test:unit:mocha" \
  "yarn test:unit:jest" \
  "yarn test:unit:global"
