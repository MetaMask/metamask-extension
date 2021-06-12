#!/usr/bin/env bash

set -e
set -u
set -o pipefail

CHROME_VERSION='91.0.4472.101-1'
CHROME_BINARY="google-chrome-stable_${CHROME_VERSION}_amd64.deb"
CHROME_BINARY_URL="http://dl.google.com/linux/chrome/deb/pool/main/g/google-chrome-stable/${CHROME_BINARY}"

sudo apt purge google-chrome-stable

wget -qO "${CHROME_BINARY}" -t 5 "${CHROME_BINARY_URL}"

sudo apt -y install "./${CHROME_BINARY}"

rm -rf "${CHROME_BINARY}"

sudo sed -i 's|$HERE/chrome"|$HERE/chrome" --disable-setuid-sandbox --no-sandbox --disable-dev-shm-usage|g' "/opt/google/chrome/google-chrome"

printf '%s\n' "CHROME ${CHROME_VERSION} configured"

sudo apt install -y xvfb
