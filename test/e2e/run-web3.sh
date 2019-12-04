#!/usr/bin/env bash

set -e
set -u
set -o pipefail

export PATH="$PATH:./node_modules/.bin"

concurrently --kill-others \
  --names 'dapp,e2e' \
  --prefix '[{time}][{name}]' \
  'static-server test/web3 --port 8080' \
  'sleep 5 && mocha test/e2e/web3.spec'
