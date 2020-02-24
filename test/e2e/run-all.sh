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

<<<<<<< HEAD
export GANACHE_ARGS="${BASE_GANACHE_ARGS} --deterministic --account=0x250F458997A364988956409A164BA4E16F0F99F916ACDD73ADCD3A1DE30CF8D1,0  --account=0x53CB0AB5226EEBF4D872113D98332C1555DC304443BEE1CF759D15798D3C55A9,25000000000000000000"
=======
concurrently --kill-others \
  --names 'dapp,e2e' \
  --prefix '[{time}][{name}]' \
  --success first \
  'yarn dapp' \
  'mocha test/e2e/permissions.spec'

>>>>>>> eebc504b0f23d7c7b725e111a89665a2ac7d50dc
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
