#!/usr/bin/env bash

set -x
set -e
set -u
set -o pipefail

export PATH="$PATH:./node_modules/.bin"
export GANACHE_ARGS="${GANACHE_ARGS:---quiet}"

export GANACHE_ARGS="--blockTime 2 $GANACHE_ARGS"
concurrently --kill-others \
  --names 'ganache,dapp,e2e' \
  --prefix '[{time}][{name}]' \
  --success first \
  'npm run ganache:start' \
  'npm run dapp' \
  'sleep 5 && mocha test/e2e/metamask-ui.spec'

export GANACHE_ARGS="--blockTime 2 $GANACHE_ARGS"
concurrently --kill-others \
  --names 'ganache,dapp,e2e' \
  --prefix '[{time}][{name}]' \
  --success first \
  'npm run ganache:start' \
  'npm run dapp' \
  'sleep 5 && mocha test/e2e/metamask-responsive-ui.spec'

export GANACHE_ARGS="--deterministic --account=0x53CB0AB5226EEBF4D872113D98332C1555DC304443BEE1CF759D15798D3C55A9,25000000000000000000 $GANACHE_ARGS"
concurrently --kill-others \
  --names 'ganache,e2e' \
  --prefix '[{time}][{name}]' \
  --success first \
  'npm run ganache:start' \
  'sleep 5 && mocha test/e2e/from-import-ui.spec'
