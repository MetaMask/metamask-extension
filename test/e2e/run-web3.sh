#!/usr/bin/env bash

set -e
set -u
set -o pipefail

export PATH="$PATH:./node_modules/.bin"

shell-parallel -s 'static-server test/web3 --port 8080' -x 'sleep 5 && mocha test/e2e/web3.spec'
