#!/usr/bin/env bash

set -e
set -u
set -o pipefail

sudo apt-get update

# To get the latest version, see <https://www.ubuntuupdates.org/ppa/google_chrome?dist=stable>
CHROME_VERSION='114.0.5735.133-1'
CHROME_BINARY="google-chrome-stable_${CHROME_VERSION}_amd64.deb"
CHROME_BINARY_URL="https://dl.google.com/linux/chrome/deb/pool/main/g/google-chrome-stable/${CHROME_BINARY}"

# To retrieve this checksum, run the `wget` and `shasum` commands below
CHROME_BINARY_SHA512SUM='0b1a18c44efb72ed3e69a5f78419ff5fa973df42b18a8becfcc3d4f6825957c637e9396d07756f910f2d9c7c85a3e2b64cc30cca18182ae8811feadd609f159d'

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
