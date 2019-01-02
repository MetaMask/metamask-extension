#!/usr/bin/env bash

export PATH="$PATH:./node_modules/.bin"

npm run ganache:start -- -b 2 >> /dev/null 2>&1 &
sleep 5
cd test/e2e/beta/
rm -rf drizzle-test
mkdir drizzle-test && cd drizzle-test
npm install --unsafe-perm truffle
../../../../node_modules/.bin/truffle unbox drizzle
echo "Deploying contracts for Drizzle test..."
../../../../node_modules/.bin/truffle compile && ../../../../node_modules/.bin/truffle migrate
BROWSER=none npm start >> /dev/null 2>&1 &
cd ../../../../
mocha test/e2e/beta/drizzle.spec
