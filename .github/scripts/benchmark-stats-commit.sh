#!/usr/bin/env bash

set -e
set -u
set -o pipefail

if [[ -z "${EXTENSION_BENCHMARK_STATS_TOKEN:-}" ]]; then
    printf '%s\n' 'EXTENSION_BENCHMARK_STATS_TOKEN environment variable must be set'
    exit 1
fi

if [[ -z "${HEAD_COMMIT_HASH:-}" ]]; then
    printf '%s\n' 'HEAD_COMMIT_HASH environment variable must be set'
    exit 1
fi

if [[ -z "${OWNER:-}" ]]; then
    printf '%s\n' 'OWNER environment variable must be set'
    exit 1
fi

mkdir temp

git config --global user.email "metamaskbot@users.noreply.github.com"

git config --global user.name "MetaMask Bot"

git clone --depth 1 https://github.com/MetaMask/extension_benchmark_stats.git temp

cd temp

git fetch origin main:main

git checkout main

BENCHMARK_FILE="../test-artifacts/benchmarks/page-load-benchmark-results.json"
STATS_FILE="stats/page_load_data.json"
TEMP_FILE="stats/page_load_data.temp.json"

# Ensure the JSON file exists
if [[ ! -f "${STATS_FILE}" ]]; then
    echo "{}" > "${STATS_FILE}"
fi

# Validate JSON files before modification
jq . "${STATS_FILE}" > /dev/null || {
    echo "Error: Existing stats JSON is invalid"
    exit 1
}
jq . "${BENCHMARK_FILE}" > /dev/null || {
    echo "Error: New benchmark JSON is invalid"
    exit 1
}

# Check if the SHA already exists in the stats file
if jq -e "has(\"${HEAD_COMMIT_HASH}\")" "${STATS_FILE}" > /dev/null; then
    echo "SHA ${HEAD_COMMIT_HASH} already exists in stats file. No new commit needed."
    exit 0
fi

# Append new benchmark data correctly using jq
jq --arg sha "${HEAD_COMMIT_HASH}" --argjson data "$(cat "${BENCHMARK_FILE}")" \
    '. + {($sha): $data}' "${STATS_FILE}" > "${TEMP_FILE}"

# Overwrite the original JSON file with the corrected version
mv "${TEMP_FILE}" "${STATS_FILE}"

# Only add the JSON file
git add stats/page_load_data.json

git commit --message "Adding page load benchmark data at commit: ${HEAD_COMMIT_HASH}"

repo_slug="${OWNER}/extension_benchmark_stats"

git push "https://metamaskbot:${EXTENSION_BENCHMARK_STATS_TOKEN}@github.com/${repo_slug}" main

cd ..

rm -rf temp
