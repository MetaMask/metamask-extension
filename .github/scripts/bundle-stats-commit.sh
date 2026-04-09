#!/usr/bin/env bash

set -e
set -u
set -o pipefail

if [[ -z "${EXTENSION_BUNDLESIZE_STATS_TOKEN:-}" ]]; then
    printf '%s\n' 'EXTENSION_BUNDLESIZE_STATS_TOKEN environment variable must be set'
    exit 1
fi

if [[ -z "${GITHUB_SHA:-}" ]]; then
    printf '%s\n' 'GITHUB_SHA environment variable must be set'
    exit 1
fi

if [[ -z "${GITHUB_REPOSITORY_OWNER:-}" ]]; then
    printf '%s\n' 'GITHUB_REPOSITORY_OWNER environment variable must be set'
    exit 1
fi

mkdir temp

git clone --depth 1 https://github.com/MetaMask/extension_bundlesize_stats.git temp

BROWSERIFY_BUNDLE_SIZE_FILE="test-artifacts/chrome/browserify/bundle_size_stats.json"
WEBPACK_BUNDLE_SIZE_FILE="test-artifacts/chrome/webpack/bundle_size_stats.json"
STATS_FILE="temp/stats/bundle_size_data.json"
TEMP_FILE="temp/stats/bundle_size_data.temp.json"

# Ensure the JSON file exists
if [[ ! -f "${STATS_FILE}" ]]; then
    echo "{}" > "${STATS_FILE}"
fi

# Validate JSON files before modification
jq . "${STATS_FILE}" > /dev/null || {
    echo "Error: Existing stats JSON is invalid"
    exit 1
}
jq . "${BROWSERIFY_BUNDLE_SIZE_FILE}" > /dev/null || {
    echo "Error: Browserify bundle size JSON is invalid"
    exit 1
}
jq . "${WEBPACK_BUNDLE_SIZE_FILE}" > /dev/null || {
    echo "Error: Webpack bundle size JSON is invalid"
    exit 1
}

# Skip the commit if both stored bundler summaries already match the new ones
if jq -e \
    --arg sha "${GITHUB_SHA}" \
    --argjson browserify "$(cat "${BROWSERIFY_BUNDLE_SIZE_FILE}")" \
    --argjson webpack "$(cat "${WEBPACK_BUNDLE_SIZE_FILE}")" \
    '
    .[$sha].browserify == $browserify and
    .[$sha].webpack == $webpack
    ' "${STATS_FILE}" > /dev/null; then
    echo "Bundle size stats for SHA ${GITHUB_SHA} are already up to date. No new commit needed."
    exit 0
fi

# Append new bundle size data correctly using jq
jq \
    --arg sha "${GITHUB_SHA}" \
    --argjson browserify "$(cat "${BROWSERIFY_BUNDLE_SIZE_FILE}")" \
    --argjson webpack "$(cat "${WEBPACK_BUNDLE_SIZE_FILE}")" \
    '
    .[$sha] = (
      (if (.[$sha] | type) == "object" then .[$sha] else {} end) +
      {
        browserify: $browserify,
        webpack: $webpack
      }
    )
    ' "${STATS_FILE}" > "${TEMP_FILE}"

# Overwrite the original JSON file with the corrected version
mv "${TEMP_FILE}" "${STATS_FILE}"

cd temp

git config user.email "metamaskbot@users.noreply.github.com"

git config user.name "MetaMask Bot"

# Only add the JSON file
git add stats/bundle_size_data.json

git commit --message "Adding bundle size at commit: ${GITHUB_SHA}"

repo_slug="${GITHUB_REPOSITORY_OWNER}/extension_bundlesize_stats"

git push "https://metamaskbot:${EXTENSION_BUNDLESIZE_STATS_TOKEN}@github.com/${repo_slug}" main

cd ..

rm -rf temp
