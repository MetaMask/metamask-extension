#!/usr/bin/env bash

set -e
set -u
set -o pipefail

CHROME_VERSION='79.0.3945.117-1'
CHROME_BINARY="google-chrome-stable_${CHROME_VERSION}_amd64.deb"
CHROME_BINARY_URL="http://mirror.cs.uchicago.edu/google-chrome/pool/main/g/google-chrome-stable/${CHROME_BINARY}"

CHROME_BINARY_SHA512SUM='2d4f76202219a40e560477d79023fa4a847187a086278924a9d916dcd5fbefafdcf7dfd8879fae907b8276b244e71a3b8a1b00a88dee87b18738ce31134a6713'

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
