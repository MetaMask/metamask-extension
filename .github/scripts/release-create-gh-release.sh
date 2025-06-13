#!/usr/bin/env bash

set -e

if [[ -z "${GITHUB_TOKEN}" ]]; then
    echo "::error::GITHUB_TOKEN not provided. Set the 'GITHUB_TOKEN' environment variable."
    exit 1
fi

if [[ -z "${GITHUB_REPOSITORY}" ]]; then
    echo "::error::GITHUB_REPOSITORY not provided. Set the 'GITHUB_REPOSITORY' environment variable."
    exit 1
fi

if [[ -z "${GITHUB_SHA}" ]]; then
    echo "::error::GITHUB_SHA not provided. Set the 'GITHUB_SHA' environment variable."
    exit 1
fi

function print_build_version() {
    local build_type="${1}"
    shift

    local filename
    filename="$(find "./build-${build_type}-browserify" -type f -name "metamask-${build_type}-chrome-*.zip" -exec basename {} .zip \;)"

    local build_filename_prefix
    build_filename_prefix="metamask-${build_type}-chrome-"
    local build_filename_prefix_size
    build_filename_prefix_size="${#build_filename_prefix}"

    # Use substring parameter expansion to remove the filename prefix, leaving just the version
    echo "${filename:${build_filename_prefix_size}}"
}

function publish_tag() {
    local build_name="${1}"
    shift
    local build_version="${1}"
    shift

    git config user.email "metamaskbot@users.noreply.github.com"
    git config user.name "MetaMask Bot"
    git tag -a "v${build_version}" -m "${build_name} version ${build_version}"
    git push "https://${GITHUB_TOKEN}@github.com/${GITHUB_REPOSITORY}" "v${build_version}"
}

current_commit_msg=$(git show -s --format='%s' HEAD)

if [[ "${current_commit_msg}" =~ Version[-[:space:]](v[[:digit:]]+.[[:digit:]]+.[[:digit:]]+) ]]; then
    tag="${BASH_REMATCH[1]}"
    flask_version="$(print_build_version 'flask')"

    printf '%s\n' 'Creating GitHub Release'
    release_body="$(awk -v version="[${tag##v}]" -f .github/scripts/show-changelog.awk CHANGELOG.md)"
    gh release create "${tag}" \
        build-dist-browserify/builds/metamask-chrome-*.zip \
        build-dist-mv2-browserify/builds/metamask-firefox-*.zip \
        build-flask-browserify/builds/metamask-flask-chrome-*.zip \
        build-flask-mv2-browserify/builds/metamask-flask-firefox-*.zip \
        --title "Version ${tag##v}" \
        --notes "${release_body}" \
        --target "${GITHUB_SHA}"

    publish_tag 'Flask' "${flask_version}"
else
    printf '%s\n' 'Version not found in commit message; skipping GitHub Release'
    exit 0
fi
