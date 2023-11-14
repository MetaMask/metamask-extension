#!/usr/bin/env bash

set -e
set -u
set -o pipefail

sudo apt-get update

# To get the latest version, see <https://www.ubuntuupdates.org/ppa/google_chrome?dist=stable>
CHROME_VERSION='118.0.5993.88-1'
CHROME_BINARY="google-chrome-stable_${CHROME_VERSION}_amd64.deb"
CHROME_BINARY_URL="https://dl.google.com/linux/chrome/deb/pool/main/g/google-chrome-stable/${CHROME_BINARY}"

# To retrieve this checksum, run the `wget` and `shasum` commands below
CHROME_BINARY_SHA512SUM='cae6a5cd8632ad350b41f4dfaf80449e6cf19d0b02816b9a1600f54b15df2adf5c4ded3792bfbe3855fa11a79ea256622f50180aa3c6779cedd75a55e7a6da9d'

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
