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

if [[ "${CIRCLE_BRANCH}" != "main" ]]
then
    printf 'This is not main branch'
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

git clone --depth=1 git@github.com:MetaMask/extension_bundlesize_stats.git temp

BUNDLE_SIZE_FILE="test-artifacts/chrome/bundle_size_stats.json"
STATS_FILE="temp/stats/bundle_size_data.json"
TEMP_FILE="temp/stats/bundle_size_data.temp.json"

# Ensure the JSON file exists
if [[ ! -f "$STATS_FILE" ]]; then
    echo "{}" > "$STATS_FILE"
fi

# Validate JSON files before modification
jq . "$STATS_FILE" > /dev/null || { echo "Error: Existing stats JSON is invalid"; exit 1; }
jq . "$BUNDLE_SIZE_FILE" > /dev/null || { echo "Error: New bundle size JSON is invalid"; exit 1; }

# Check if the SHA already exists in the stats file
if jq -e "has(\"$CIRCLE_SHA1\")" "$STATS_FILE" > /dev/null; then
    echo "SHA $CIRCLE_SHA1 already exists in stats file. No new commit needed."
    exit 0
fi

# Append new bundle size data correctly using jq
jq --arg sha "$CIRCLE_SHA1" --argjson data "$(cat "$BUNDLE_SIZE_FILE")" \
   '. + {($sha): $data}' "$STATS_FILE" > "$TEMP_FILE"

# Overwrite the original JSON file with the corrected version
mv "$TEMP_FILE" "$STATS_FILE"

cd temp

# Only add the JSON file
git add stats/bundle_size_data.json

git commit --message "Adding bundle size at commit: ${CIRCLE_SHA1}"

repo_slug="$CIRCLE_PROJECT_USERNAME/extension_bundlesize_stats"
git push "https://$GITHUB_TOKEN_USER:$GITHUB_TOKEN@github.com/$repo_slug" main

cd ..

rm -rf temp
