#!/usr/bin/env bash
set -x

yarn --frozen-lockfile --ignore-scripts --har

# run each in subshell so directory change does not persist

# for build
(cd node_modules/node-sass && yarn run build)
(cd node_modules/optipng-bin && yarn run postinstall)
(cd node_modules/gifsicle && yarn run postinstall)
(cd node_modules/jpegtran-bin && yarn run postinstall)
