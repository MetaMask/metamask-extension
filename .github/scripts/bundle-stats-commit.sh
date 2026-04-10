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

temp_dir="$(mktemp -d)"
trap 'rm -rf "${temp_dir}"' EXIT

git clone --depth 1 https://github.com/MetaMask/extension_bundlesize_stats.git "${temp_dir}"

browserify_bundle_size_file='test-artifacts/chrome/browserify/bundle_size_stats.json'
webpack_bundle_size_file='test-artifacts/chrome/webpack/bundle_size_stats.json'
stats_file="${temp_dir}/stats/bundle_size_data.json"
temp_stats_file="${temp_dir}/stats/bundle_size_data.temp.json"

if [[ ! -f "${stats_file}" ]]; then
    echo '{}' > "${stats_file}"
fi

for file in "${stats_file}" "${browserify_bundle_size_file}" "${webpack_bundle_size_file}"; do
    jq -e . "${file}" > /dev/null
done

browserify_bundle_size="$(< "${browserify_bundle_size_file}")"
webpack_bundle_size="$(< "${webpack_bundle_size_file}")"

if jq -e \
    --arg sha "${GITHUB_SHA}" \
    --argjson browserify "${browserify_bundle_size}" \
    --argjson webpack "${webpack_bundle_size}" \
    '
    .[$sha].browserify == $browserify and
    .[$sha].webpack == $webpack
    ' "${stats_file}" > /dev/null; then
    echo "Bundle size stats for SHA ${GITHUB_SHA} are already up to date. No new commit needed."
    exit 0
fi

jq \
    --arg sha "${GITHUB_SHA}" \
    --argjson browserify "${browserify_bundle_size}" \
    --argjson webpack "${webpack_bundle_size}" \
    '
    .[$sha] = (
      (if (.[$sha] | type) == "object" then .[$sha] else {} end) +
      {
        browserify: $browserify,
        webpack: $webpack
      }
    )
    ' "${stats_file}" > "${temp_stats_file}"

mv "${temp_stats_file}" "${stats_file}"

git -C "${temp_dir}" config user.email "metamaskbot@users.noreply.github.com"
git -C "${temp_dir}" config user.name "MetaMask Bot"
git -C "${temp_dir}" add stats/bundle_size_data.json
git -C "${temp_dir}" commit --message "Adding bundle size at commit: ${GITHUB_SHA}"

repo_slug="${GITHUB_REPOSITORY_OWNER}/extension_bundlesize_stats"

git -C "${temp_dir}" push "https://metamaskbot:${EXTENSION_BUNDLESIZE_STATS_TOKEN}@github.com/${repo_slug}" main
