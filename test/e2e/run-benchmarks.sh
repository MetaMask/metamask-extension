#!/usr/bin/env bash

set -e
set -u
set -o pipefail

retry () {
  retry=0
  limit=5
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

retry node test/e2e/benchmark.js
