#!/usr/bin/env bash

set -e
set -u
set -o pipefail

if [[ "${CI:-}" != 'true' ]]
then
    printf '%s\n' 'CI environment variable must be set to true'
    exit 1
fi

# if [[ "${GITHUB_REF_NAME}" != "main" ]]
# then
#     printf 'This is not the main branch'
#     exit 0
# fi

if [[ -z "${EXTENSION_BUNDLESIZE_STATS_TOKEN:-}" ]]
then
    printf '%s\n' 'EXTENSION_BUNDLESIZE_STATS_TOKEN environment variable must be set'
    exit 1
fi

mkdir temp

git config --global user.email "metamaskbot@users.noreply.github.com"

git config --global user.name "MetaMask Bot"

git clone https://github.com/MetaMask/extension_bundlesize_stats.git temp --depth 1

{
    echo " '${GITHUB_SHA}': ";
    cat test-artifacts/chrome/bundle_size_stats.json;
    echo ", ";
} >> temp/stats/bundle_size_data.temp.js

cp temp/stats/bundle_size_data.temp.js temp/stats/bundle_size_data.js

echo " }" >> temp/stats/bundle_size_data.js

if [ -f temp/stats/bundle_size_data.json ]; then
  # copy bundle_size_data.json in bundle_size_data.temp.json without last 2 lines
  head -$(($(wc -l < temp/stats/bundle_size_data.json) - 2)) temp/stats/bundle_size_data.json > bundle_size_stats.temp.json

  {
    echo "},";
    echo "\"$GITHUB_SHA\":";
    cat test-artifacts/chrome/bundle_size_stats.json;
    echo "}";
  } >> bundle_size_stats.temp.json
else
  {
    echo "{";
    echo "\"$GITHUB_SHA\":";
    cat test-artifacts/chrome/bundle_size_stats.json;
    echo "}";
  } > bundle_size_stats.temp.json
fi

jq . bundle_size_stats.temp.json > temp/stats/bundle_size_data.json
rm bundle_size_stats.temp.json

cd temp

git add .

git commit --message "Adding bundle size at commit: ${GITHUB_SHA}"

repo_slug="$GITHUB_REPOSITORY_OWNER/extension_bundlesize_stats"
git push "https://metamaskbot:$EXTENSION_BUNDLESIZE_STATS_TOKEN@github.com/$repo_slug" main

cd ..

rm -rf temp
