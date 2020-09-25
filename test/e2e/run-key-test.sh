#!/usr/bin/env bash

set -x
set -e
set -o pipefail

export PATH="$PATH:./node_modules/.bin"

concurrently --kill-others \
             --names 'dapp,e2e' \
             --prefix '[{time}][{name}]' \
             --success first \
             'yarn dapp' \
             'mocha test/e2e/metamask-ui.spec' || exit 8
