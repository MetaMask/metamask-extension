#!/usr/bin/env bash

export PATH="$PATH:./node_modules/.bin"

npm run ganache:start -- -b 2 >> /dev/null 2>&1 &
sleep 5
cd test/e2e/beta/
rm -rf drizzle-test
mkdir drizzle-test && cd drizzle-test
npm install truffle
truffle unbox https://github.com/brunobar79/drizzle-box/
echo "Deploying contracts for Drizzle test..."
truffle compile && truffle migrate
BROWSER=none npm start >> /dev/null 2>&1 &
cd ../../../../
mocha test/e2e/beta/drizzle.spec
