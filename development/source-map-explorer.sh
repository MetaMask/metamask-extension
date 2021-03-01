#!/usr/bin/env bash

set -x
set -e
set -u
set -o pipefail

mkdir -p build-artifacts/source-map-explorer
yarn source-map-explorer dist/chrome/inpage.js --html build-artifacts/source-map-explorer/inpage.html
yarn source-map-explorer dist/chrome/contentscript.js --html build-artifacts/source-map-explorer/contentscript.html
yarn source-map-explorer dist/chrome/background.js --html build-artifacts/source-map-explorer/background.html
yarn source-map-explorer dist/chrome/bg-libs.js --html build-artifacts/source-map-explorer/bg-libs.html
yarn source-map-explorer dist/chrome/ui.js --html build-artifacts/source-map-explorer/ui.html
yarn source-map-explorer dist/chrome/ui-libs.js --html build-artifacts/source-map-explorer/ui-libs.html
yarn source-map-explorer dist/chrome/phishing-detect.js --html build-artifacts/source-map-explorer/phishing-detect.html
