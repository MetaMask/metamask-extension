#!/usr/bin/env bash

set -e
set -u
set -o pipefail

CHROME_VERSION='79.0.3945.117-1'
CHROME_BINARY="google-chrome-stable_${CHROME_VERSION}_amd64.deb"
CHROME_BINARY_URL="http://dl.google.com/linux/chrome/deb/pool/main/g/google-chrome-stable/${CHROME_BINARY}"

wget -O "${CHROME_BINARY}" -t 5 "${CHROME_BINARY_URL}"

(sudo dpkg -i "${CHROME_BINARY}" || sudo apt-get -fy install)

rm -rf "${CHROME_BINARY}"

sudo sed -i 's|HERE/chrome"|HERE/chrome" --disable-setuid-sandbox --no-sandbox|g' "/opt/google/chrome/google-chrome"

printf '%s\n' "CHROME ${CHROME_VERSION} configured"
