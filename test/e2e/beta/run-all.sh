#!/usr/bin/env bash

set -e
set -u
set -o pipefail

export PATH="$PATH:./node_modules/.bin"

shell-parallel -s 'npm run ganache:start' -x 'sleep 5 && static-server test/e2e/beta/contract-test/ --port 8080' -x 'sleep 5 && mocha test/e2e/beta/metamask-beta-ui.spec'
shell-parallel -s 'npm run ganache:start -- -d'  -x 'sleep 5 && static-server test/e2e/beta/contract-test/ --port 8080' -x 'sleep 5 && mocha test/e2e/beta/from-import-beta-ui.spec'
