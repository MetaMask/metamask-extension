#!/usr/bin/env bash

set -e
set -u
set -o pipefail

sudo apt-get install libu2f-udev libvulkan1

# To get the latest version, see <https://www.ubuntuupdates.org/ppa/google_chrome?dist=stable>
CHROME_VERSION='111.0.5563.64-1'
CHROME_BINARY="google-chrome-stable_${CHROME_VERSION}_amd64.deb"
CHROME_BINARY_URL="https://dl.google.com/linux/chrome/deb/pool/main/g/google-chrome-stable/${CHROME_BINARY}"

# To retrieve this checksum, run the `wget` and `shasum` commands below
CHROME_BINARY_SHA512SUM='bbfd436c17d6f0554b91211ecf1324aeeac012f1d000d610f93956dbfb8387c0adb56f921c5b7bcc1833c49ab2abbd3bbc250001f650b3ca4f79cebe708c29ae'

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
