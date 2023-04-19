#!/usr/bin/env bash

set -e
set -u
set -o pipefail

# To get the latest version, see <https://www.ubuntuupdates.org/ppa/google_chrome?dist=stable>
CHROME_VERSION='112.0.5615.121-1'
CHROME_BINARY="google-chrome-stable_${CHROME_VERSION}_amd64.deb"
CHROME_BINARY_URL="https://dl.google.com/linux/chrome/deb/pool/main/g/google-chrome-stable/${CHROME_BINARY}"

# To retrieve this checksum, run the `wget` and `shasum` commands below
CHROME_BINARY_SHA512SUM='46a9960a9fa5b67802026996034a8c594d44689ad2300f07ca7d419a1ae06a5239f6a0a3615a04f6339f751fc8d80f207458d7a94befb127c356e6f5a8422e8f'

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

printf '%s\n' "CHROME ${CHROME_VERSION} configured"
