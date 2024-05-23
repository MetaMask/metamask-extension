#!/bin/bash

xvfb-run

# Run command 1
yarn install

# Run command 2
yarn test:e2e:single test/e2e/tests/signature/signature-request.spec.js --browser=chrome
