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

retry mocha --no-timeouts test/e2e/metamask-ui.spec
