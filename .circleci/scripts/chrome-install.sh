#!/usr/bin/env bash

set -e
set -u
set -o pipefail

sudo apt-get update

# To get the latest version, see <https://www.ubuntuupdates.org/ppa/google_chrome?dist=stable>
<<<<<<< HEAD
CHROME_VERSION='116.0.5845.179-1'
=======
CHROME_VERSION='115.0.5790.170-1'
>>>>>>> fdccc8822a (wip)
CHROME_BINARY="google-chrome-stable_${CHROME_VERSION}_amd64.deb"
CHROME_BINARY_URL="https://dl.google.com/linux/chrome/deb/pool/main/g/google-chrome-stable/${CHROME_BINARY}"

# To retrieve this checksum, run the `wget` and `shasum` commands below
<<<<<<< HEAD
CHROME_BINARY_SHA512SUM='cbdad3f5c928ef79a46a3619054b3c4a73a99f942f9bf4ea75d37d6434912da5c01f6ee30718a58e869ff6b57b10bb7fea1cf91885a25aac290a50a2ee3c03c4'
=======
CHROME_BINARY_SHA512SUM='5de7b0e523d60cad0eab340db3ed9ea0f37ae87d74a479d37654e251f8b6f29ceb3867e2c036dbf52990aa34fd160f8c96025642c1ae925a055cc96b85ce78f2'
>>>>>>> fdccc8822a (wip)

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
