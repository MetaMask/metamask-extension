#!/usr/bin/env bash

set -e
set -u
set -o pipefail

npm run ganache:start -- -b 2 >> /dev/null 2>&1 &
npm_run_ganache_start_pid=$!
sleep 5

pushd "$(mktemp -d)"
npm install --no-package-lock truffle
truffle="$(npm bin)/truffle"
$truffle unbox drizzle
echo "Deploying contracts for Drizzle test..."
$truffle compile
$truffle migrate

BROWSER=none npm start >> /dev/null 2>&1 &
npm_start_pid=$!

popd
if ! mocha test/e2e/drizzle.spec
then
    test_status=1
fi

! kill -15 $npm_run_ganache_start_pid
! kill -15 $npm_start_pid
! wait $npm_run_ganache_start_pid $npm_start_pid
exit ${test_status:-}
