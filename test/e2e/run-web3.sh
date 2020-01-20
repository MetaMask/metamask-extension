#!/usr/bin/env bash

set -e
set -u
set -o pipefail

export PATH="$PATH:./node_modules/.bin"

concurrently --kill-others \
  --names 'dapp,e2e' \
  --prefix '[{time}][{name}]' \
  'serve test/web3 --listen 8080 --symlinks' \
  'sleep 5 && mocha test/e2e/web3.spec'
