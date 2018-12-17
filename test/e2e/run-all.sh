#!/usr/bin/env bash

set -e
set -u
set -o pipefail

export PATH="$PATH:./node_modules/.bin"

shell-parallel -s 'npm run ganache:start -- -b 2' -x 'sleep 5 && static-server test/e2e/contract-test --port 8080' -x 'sleep 5 && mocha test/e2e/metamask-ui.spec'
shell-parallel -s 'npm run ganache:start -- -b 2' -x 'sleep 5 && static-server test/e2e/contract-test --port 8080' -x 'sleep 5 && mocha test/e2e/metamask-responsive-ui.spec'
shell-parallel -s 'npm run ganache:start -- -d -b 2'  -x 'sleep 5 && mocha test/e2e/from-import-ui.spec'
