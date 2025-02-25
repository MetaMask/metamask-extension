#!/usr/bin/env bash

set -e
set -o pipefail

if [[ "${CI:-}" != 'true' ]]
then
    printf '%s\n' 'CI environment variable must be set to true'
    exit 1
fi

if [[ "${CIRCLECI:-}" != 'true' ]]
then
    printf '%s\n' 'CIRCLECI environment variable must be set to true'
    exit 1
fi

git config user.name "MetaMask Bot"
git config user.email metamaskbot@users.noreply.github.com
git clone git@github.com:MetaMask/firefox-bundle-script.git

cp .circleci/scripts/bundle.sh firefox-bundle-script/bundle.sh

cd firefox-bundle-script

ls

# Insert exported environment variables
awk -F '=' '/^\s*export / {gsub(/^export /, ""); print $1}' bundle.sh | while read -r var; do
    if [[ -n "${!var}" ]]; then
        sed -i '' "s|^\(\s*export $var=\).*|\1\"${!var}\"|" bundle.sh
    fi
done

git add bundle.sh

version=$(git show -s --format='%s' HEAD | grep -Eo 'v[0-9]+\.[0-9]+\.[0-9]+')
git commit -m "${version}"
git push origin main
