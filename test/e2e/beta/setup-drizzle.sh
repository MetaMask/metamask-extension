#!/usr/bin/env bash

set -e
set -u
set -o pipefail

export PATH="$PATH:./node_modules/.bin"

cd test/e2e/beta/drizzle-app
truffle compile
truffle deploy
npm run start