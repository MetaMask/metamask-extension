#!/usr/bin/env bash

set -e
set -u
set -o pipefail

CHROME_VERSION='87.0.4280.88-1'
CHROME_BINARY="google-chrome-stable_${CHROME_VERSION}_amd64.deb"
CHROME_BINARY_URL="https://dl.google.com/linux/chrome/deb/pool/main/g/google-chrome-stable/${CHROME_BINARY}"

CHROME_BINARY_SHA512SUM='19eea1d1be171cab60ce5135572da9388b4b72e313118478b53f65c0bf2293733809282736b98ef828a208b7426e5191258f8c666cba7510b8bf5c92d0010a47'

wget -O "${CHROME_BINARY}" -t 5 "${CHROME_BINARY_URL}"

if [[ $(shasum -a 512 "${CHROME_BINARY}" | cut '--delimiter= ' -f1) != "${CHROME_BINARY_SHA512SUM}" ]]
then
  echo "Google Chrome binary checksum did not match."
  exit 1
else
  echo "Google Chrome binary checksum verified."
fi

(sudo dpkg -i "${CHROME_BINARY}" || sudo apt-get -fy install)

rm -rf "${CHROME_BINARY}"

sudo sed -i 's|HERE/chrome"|HERE/chrome" --disable-setuid-sandbox --no-sandbox|g' "/opt/google/chrome/google-chrome"

printf '%s\n' "CHROME ${CHROME_VERSION} configured"
