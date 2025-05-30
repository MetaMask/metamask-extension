#!/usr/bin/env bash

set -e

if [[ -z "${FIREFOX_BUNDLE_SCRIPT_TOKEN}" ]]; then
    echo "::error::FIREFOX_BUNDLE_SCRIPT_TOKEN not provided. Set the 'FIREFOX_BUNDLE_SCRIPT_TOKEN' environment variable."
    exit 1
fi

git config --global user.name "MetaMask Bot"
git config --global user.email metamaskbot@users.noreply.github.com
version=$(git show -s --format='%s' HEAD | grep -Eo 'v[0-9]+\.[0-9]+\.[0-9]+')

git clone "https://${FIREFOX_BUNDLE_SCRIPT_TOKEN}@github.com/MetaMask/firefox-bundle-script.git"
cd firefox-bundle-script
git checkout release
cp ../.github/scripts/bundle.sh ./bundle.sh

# sed works differently on macOS and Linux
# macOS requires an empty string argument for -i
# so we need to handle this case based on the OS
if sed --version 2> /dev/null | grep -q GNU; then
    SED_OPTS=(-i)
else
    SED_OPTS=(-i '')
fi

# Insert exported environment variables
awk -F '=' '/^\s*export / {gsub(/^export /, ""); print $1}' bundle.sh | while read -r var; do
    if [[ -n "${!var}" ]]; then
        sed "${SED_OPTS[@]}" "s|^\(\s*export ${var}=\).*|\1\"${!var}\"|" bundle.sh
    fi
done

git add bundle.sh
git commit --allow-empty -m "${version}"
git push origin release
