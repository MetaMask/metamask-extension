#!/usr/bin/env bash

set -x
set -e
set -u
set -o pipefail

retry () {
  retry=0
  limit="${METAMASK_E2E_RETRY_LIMIT:-3}"
  while [[ $retry -lt $limit ]]
  do
    "$@" && break
    retry=$(( retry + 1 ))
    sleep 1
  done

  if [[ $retry == "$limit" ]]
  then
    exit 1
  fi
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

retry concurrently --kill-others \
  --names 'dapp,e2e' \
  --prefix '[{time}][{name}]' \
  --success first \
  'yarn dapp' \
  'mocha test/e2e/metamask-responsive-ui.spec'

retry concurrently --kill-others \
  --names 'e2e' \
  --prefix '[{time}][{name}]' \
  --success first \
  'mocha test/e2e/from-import-ui.spec'

retry concurrently --kill-others \
  --names 'sendwithprivatedapp,e2e' \
  --prefix '[{time}][{name}]' \
  --success first \
  'yarn sendwithprivatedapp' \
  'mocha test/e2e/incremental-security.spec'

