#!/usr/bin/env bash

set -x
set -e
set -o pipefail

export PATH="$PATH:./node_modules/.bin"

if [[ "$BUILDKITE_PARALLEL_JOB" = '0' ]]; then
  mocha --no-timeouts test/e2e/tests/*.spec.js || exit 8
fi


if [[ "$BUILDKITE_PARALLEL_JOB" = '1' ]]; then
  concurrently --kill-others \
               --names 'dapp,e2e' \
               --prefix '[{time}][{name}]' \
               --success first \
               'yarn dapp' \
               'mocha test/e2e/metamask-responsive-ui.spec' || exit 8
fi

if [[ "$BUILDKITE_PARALLEL_JOB" = '2' ]]; then
  concurrently --kill-others \
               --names 'dapp,e2e' \
               --prefix '[{time}][{name}]' \
               --success first \
               'yarn dapp' \
               'mocha test/e2e/signature-request.spec' || exit 8
fi

if [[ "$BUILDKITE_PARALLEL_JOB" = '3' ]]; then
  concurrently --kill-others \
               --names 'e2e' \
               --prefix '[{time}][{name}]' \
               --success first \
               'mocha test/e2e/from-import-ui.spec' || exit 8
fi

if [[ "$BUILDKITE_PARALLEL_JOB" = '4' ]]; then
  concurrently --kill-others \
               --names 'e2e' \
               --prefix '[{time}][{name}]' \
               --success first \
               'mocha test/e2e/send-edit.spec' || exit 8
fi

if [[ "$BUILDKITE_PARALLEL_JOB" = '5' ]]; then
  concurrently --kill-others \
               --names 'dapp,e2e' \
               --prefix '[{time}][{name}]' \
               --success first \
               'yarn dapp' \
               'mocha test/e2e/ethereum-on.spec' || exit 8
fi

if [[ "$BUILDKITE_PARALLEL_JOB" = '6' ]]; then
  concurrently --kill-others \
               --names 'dapp,e2e' \
               --prefix '[{time}][{name}]' \
               --success first \
               'yarn dapp' \
               'mocha test/e2e/permissions.spec' || exit 8
fi

  # concurrently --kill-others \
    #   --names 'sendwithprivatedapp,e2e' \
    #   --prefix '[{time}][{name}]' \
    #   --success first \
    #   'yarn sendwithprivatedapp' \
    #   'mocha test/e2e/incremental-security.spec' || exit 8

if [[ "$BUILDKITE_PARALLEL_JOB" = '7' ]]; then
  concurrently --kill-others \
               --names 'dapp,e2e' \
               --prefix '[{time}][{name}]' \
               --success first \
               'yarn dapp' \
               'mocha test/e2e/address-book.spec' || exit 8
fi

# concurrently --kill-others \
  #   --names '3box,dapp,e2e' \
  #   --prefix '[{time}][{name}]' \
  #   --success first \
  #   'node test/e2e/mock-3box/server.js' \
  #   'yarn dapp' \
  #   'mocha test/e2e/threebox.spec'

if [[ "$BUILDKITE_PARALLEL_JOB" = '8' ]]; then
  concurrently --kill-others \
               --names 'dapp,e2e' \
               --prefix '[{time}][{name}]' \
               --success first \
               'yarn dapp' \
               'mocha test/e2e/metamask-ui.spec' || exit 8
fi
