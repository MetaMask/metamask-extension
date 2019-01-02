#!/usr/bin/env bash

export PATH="$PATH:./node_modules/.bin"

npm run ganache:start -- -b 2 >> /dev/null 2>&1 &
sleep 5
cd test/e2e/beta/
rm -rf drizzle-test
mkdir drizzle-test && cd drizzle-test
sudo npm install --unsafe-perm -g truffle
sudo truffle unbox drizzle
echo "Deploying contracts for Drizzle test..."
sudo truffle compile && sudo truffle migrate
BROWSER=none npm start >> /dev/null 2>&1 &
cd ../../../../
mocha test/e2e/beta/drizzle.spec
