#!/usr/bin/env bash

set -x
set -e
set -u
set -o pipefail

readonly __DIR__=$( cd "${BASH_SOURCE[0]%/*}" && pwd )

for spec in "${__DIR__}"/tests/*.spec.js
do
  node "${__DIR__}/run-e2e-test.js" "${spec}"
done

node "${__DIR__}/run-e2e-test.js" "${__DIR__}/metamask-ui.spec.js"
