#! /bin/bash
set -x

mkdir -p build-artifacts/source-map-explorer
npx source-map-explorer dist/chrome/inpage.js --html build-artifacts/source-map-explorer/inpage.html
npx source-map-explorer dist/chrome/contentscript.js --html build-artifacts/source-map-explorer/contentscript.html
npx source-map-explorer dist/chrome/background.js --html build-artifacts/source-map-explorer/background.html
npx source-map-explorer dist/chrome/ui.js --html build-artifacts/source-map-explorer/ui.html
npx source-map-explorer dist/chrome/libs.js --html build-artifacts/source-map-explorer/libs.html
npx source-map-explorer dist/chrome/phishing-detect.js --html build-artifacts/source-map-explorer/phishing-detect.html
