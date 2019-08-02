#!/usr/bin/env bash

set -x
set -e
set -u
set -o pipefail

export PATH="$PATH:./node_modules/.bin"
export GANACHE_ARGS='--blockTime 2 --quiet'

concurrently --kill-others \
  --names 'ganache,dapp,e2e' \
  --prefix '[{time}][{name}]' \
  --success first \
  'yarn ganache:start' \
  'yarn dapp' \
  'sleep 5 && mocha test/e2e/metamask-ui.spec'

concurrently --kill-others \
  --names 'ganache,dapp,e2e' \
  --prefix '[{time}][{name}]' \
  --success first \
  'yarn ganache:start' \
  'yarn dapp' \
  'sleep 5 && mocha test/e2e/metamask-responsive-ui.spec'

export GANACHE_ARGS="$GANACHE_ARGS --deterministic --account=0x53CB0AB5226EEBF4D872113D98332C1555DC304443BEE1CF759D15798D3C55A9,25000000000000000000"
concurrently --kill-others \
  --names 'ganache,e2e' \
  --prefix '[{time}][{name}]' \
  --success first \
  'yarn ganache:start' \
  'sleep 5 && mocha test/e2e/from-import-ui.spec'


export GANACHE_ARGS="$GANACHE_ARGS --deterministic --account=0x53CB0AB5226EEBF4D872113D98332C1555DC304443BEE1CF759D15798D3C55A9,25000000000000000000"
concurrently --kill-others \
  --names 'ganache,e2e' \
  --prefix '[{time}][{name}]' \
  --success first \
  'npm run ganache:start' \
  'sleep 5 && mocha test/e2e/send-edit.spec'


export GANACHE_ARGS="$GANACHE_ARGS --deterministic --account=0x250F458997A364988956409A164BA4E16F0F99F916ACDD73ADCD3A1DE30CF8D1,0  --account=0x53CB0AB5226EEBF4D872113D98332C1555DC304443BEE1CF759D15798D3C55A9,25000000000000000000"
concurrently --kill-others \
  --names 'ganache,sendwithprivatedapp,e2e' \
  --prefix '[{time}][{name}]' \
  --success first \
  'npm run ganache:start' \
  'npm run sendwithprivatedapp' \
  'sleep 5 && mocha test/e2e/incremental-security.spec'

concurrently --kill-others \
  --names 'ganache,dapp,e2e' \
  --prefix '[{time}][{name}]' \
  --success first \
  'yarn ganache:start' \
  'yarn dapp' \
  'sleep 5 && mocha test/e2e/address-book.spec'

