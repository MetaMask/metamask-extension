#!/usr/bin/env bash

set -x
set -e
set -u
set -o pipefail

retry () {
  retry=0
  limit="${METAMASK_E2E_RETRY_LIMIT:-10}"
  while [[ $retry -lt $limit ]]
  do
    "$@"
    retry=$(( retry + 1 ))
    sleep 1
  done
}

export PATH="$PATH:./node_modules/.bin"

for spec in test/e2e/tests/*.spec.js
do
  retry mocha --no-timeouts "${spec}"
done

retry concurrently --kill-others \
  --names 'dapp,e2e' \
  --prefix '[{time}][{name}]' \
  --success first \
  'yarn dapp' \
  'mocha test/e2e/metamask-ui.spec'

