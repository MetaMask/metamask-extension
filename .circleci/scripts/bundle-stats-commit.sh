#!/usr/bin/env bash

set -e
set -u
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

if [[ "${CIRCLE_BRANCH}" != "develop" ]]
then
    printf 'This is not develop branch'
    exit 0
fi

if [[ -z "${GITHUB_TOKEN:-}" ]]
then
    printf '%s\n' 'GITHUB_TOKEN environment variable must be set'
    exit 1
elif [[ -z "${GITHUB_TOKEN_USER:-}" ]]
then
    printf '%s\n' 'GITHUB_TOKEN_USER environment variable must be set'
    exit 1
fi

mkdir temp

git config --global user.email "metamaskbot@users.noreply.github.com"

git config --global user.name "MetaMask Bot"

git clone git@github.com:MetaMask/extension_bundlesize_stats.git temp

if [[ -f "temp/stats/bundle_size_stats-${CIRCLE_SHA1}.json" ]]
then
    printf 'Bundle size of the commit is already recorded'
    cd ..
    rm -rf temp
    exit 0
fi

cp -R test-artifacts/chrome/mv3/bundle_size_stats.json temp/stats

echo " bundle_size_stats-${CIRCLE_SHA1}.json" >> temp/stats/fileList.txt

mv temp/stats/bundle_size_stats.json "temp/stats/bundle_size_stats-${CIRCLE_SHA1}.json"

cd temp

git add .

git commit --message "Bundle size at commit: ${CIRCLE_SHA1}"

repo_slug="$CIRCLE_PROJECT_USERNAME/extension_bundlesize_stats"
git push "https://$GITHUB_TOKEN_USER:$GITHUB_TOKEN@github.com/$repo_slug" main

cd ..

rm -rf temp
