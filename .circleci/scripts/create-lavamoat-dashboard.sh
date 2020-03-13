#!/usr/bin/env bash

set -x
set -e
set -u
set -o pipefail

# prepare artifacts dir
mkdir -p ./build-artifacts/lavamoat/

# generate lavamoat config
yarn build lavamoat:dashboard
# copy config
cp dist/lavamoat/*.json ./build-artifacts/lavamoat/
# generate dashboard
npx sesify-viz \
  --deps dist/lavamoat/deps.json  \
  --config dist/lavamoat/lavamoat-config.json \
  --dest ./build-artifacts/lavamoat/dashboard