#!/usr/bin/env bash
set -x

yarn --frozen-lockfile --ignore-scripts --har

# run each in subshell so directory change does not persist
# scripts can be any of:
#   preinstall
#   install
#   postinstall

# for build
(cd node_modules/node-sass && yarn run postinstall)
(cd node_modules/optipng-bin && yarn run postinstall)
(cd node_modules/gifsicle && yarn run postinstall)
(cd node_modules/jpegtran-bin && yarn run postinstall)

# for test
(cd node_modules/scrypt && yarn run install)
(cd node_modules/weak && yarn run install)
(cd node_modules/chromedriver && yarn run install)
(cd node_modules/geckodriver && yarn run postinstall)
