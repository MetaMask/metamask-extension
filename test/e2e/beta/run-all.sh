#!/usr/bin/env bash

set -e
set -u
set -o pipefail

export PATH="$PATH:./node_modules/.bin"

shell-parallel -s 'static-server test/web3 --port 8080' -x 'sleep 5 && mocha test/e2e/beta/web3.spec'
shell-parallel -s 'npm run ganache:start -- -b 2' -x 'sleep 5 && static-server test/e2e/beta/contract-test --port 8080' -x 'sleep 5 && mocha test/e2e/beta/metamask-beta-ui.spec'
shell-parallel -s 'npm run ganache:start -- -b 2' -x 'sleep 5 && static-server test/e2e/beta/contract-test --port 8080' -x 'sleep 5 && mocha test/e2e/beta/metamask-beta-responsive-ui.spec'
shell-parallel -s 'npm run ganache:start -- -d -b 2 --account=0x53CB0AB5226EEBF4D872113D98332C1555DC304443BEE1CF759D15798D3C55A9,25000000000000000000' \
  -x 'sleep 5 && mocha test/e2e/beta/from-import-beta-ui.spec'
shell-parallel -s 'static-server test/web3 --port 8080' -x 'sleep 5 && mocha test/e2e/beta/web3.spec'
