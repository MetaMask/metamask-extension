#!/usr/bin/env bash

set -x
set -e
set -u
set -o pipefail

export PATH="$PATH:./node_modules/.bin"

mocha --no-timeouts test/e2e/tests/*.spec.js

concurrently --kill-others \
  --names 'dapp,e2e' \
  --prefix '[{time}][{name}]' \
  --success first \
  'yarn dapp' \
  'mocha test/e2e/metamask-ui.spec'

concurrently --kill-others \
  --names 'dapp,e2e' \
  --prefix '[{time}][{name}]' \
  --success first \
  'yarn dapp' \
  'mocha test/e2e/metamask-responsive-ui.spec'

concurrently --kill-others \
  --names 'dapp,e2e' \
  --prefix '[{time}][{name}]' \
  --success first \
  'yarn dapp' \
  'mocha test/e2e/signature-request.spec'

concurrently --kill-others \
  --names 'e2e' \
  --prefix '[{time}][{name}]' \
  --success first \
  'mocha test/e2e/from-import-ui.spec'

concurrently --kill-others \
  --names 'e2e' \
  --prefix '[{time}][{name}]' \
  --success first \
  'mocha test/e2e/send-edit.spec'

concurrently --kill-others \
  --names 'dapp,e2e' \
  --prefix '[{time}][{name}]' \
  --success first \
  'yarn dapp' \
  'mocha test/e2e/ethereum-on.spec'

concurrently --kill-others \
  --names 'dapp,e2e' \
  --prefix '[{time}][{name}]' \
  --success first \
  'yarn dapp' \
  'mocha test/e2e/permissions.spec'

concurrently --kill-others \
  --names 'sendwithprivatedapp,e2e' \
  --prefix '[{time}][{name}]' \
  --success first \
  'yarn sendwithprivatedapp' \
  'mocha test/e2e/incremental-security.spec'

concurrently --kill-others \
  --names 'dapp,e2e' \
  --prefix '[{time}][{name}]' \
  --success first \
  'yarn dapp' \
  'mocha test/e2e/address-book.spec'

concurrently --kill-others \
  --names '3box,dapp,e2e' \
  --prefix '[{time}][{name}]' \
  --success first \
  'node test/e2e/mock-3box/server.js' \
  'yarn dapp' \
  'mocha test/e2e/threebox.spec'
