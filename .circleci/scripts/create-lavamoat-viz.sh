#!/usr/bin/env bash

set -x
set -e
set -u
set -o pipefail

BUILD_DEST="./build-artifacts/build-viz/"

# prepare artifacts dir
mkdir -p "${BUILD_DEST}"

# generate lavamoat debug config
yarn lavamoat:debug

# generate viz
npx lavamoat-viz --dest "${BUILD_DEST}"