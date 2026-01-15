#!/usr/bin/env bash

set -e
set -o pipefail

if [[ -z "${GITHUB_TOKEN}" ]]; then
    echo "::error::GITHUB_TOKEN not provided. Set the 'GITHUB_TOKEN' environment variable."
    exit 1
fi

if [[ -z "${GITHUB_REPOSITORY}" ]]; then
    echo "::error::GITHUB_REPOSITORY not provided. Set the 'GITHUB_REPOSITORY' environment variable."
    exit 1
fi

if [[ -z "${GITHUB_SHA}" && -z "${RELEASE_SHA}" ]]; then
    echo "::error::GITHUB_SHA or RELEASE_SHA not provided. Set one of these environment variables."
    exit 1
fi

function print_build_version() {
    local build_type="${1}"
    shift

    local filename
    filename="$(find "./build-${build_type}-browserify/builds" -type f -name "metamask-${build_type}-chrome-*.zip" -exec basename {} .zip \;)"

    local build_filename_prefix
    build_filename_prefix="metamask-${build_type}-chrome-"
    local build_filename_prefix_size
    build_filename_prefix_size="${#build_filename_prefix}"

    # Use substring parameter expansion to remove the filename prefix, leaving just the version
    if [[ -z "${filename}" ]]; then
        echo ""
        return
    fi

    echo "${filename:${build_filename_prefix_size}}"
}

function publish_tag() {
    local build_name="${1}"
    shift
    local build_version="${1}"
    shift
    local target_sha="${1}"
    shift
    local tag_name_override="${1:-}"
    local tag_name=""

    if [[ -z "${target_sha}" ]]; then
        echo "::error::Target SHA not provided for ${build_name} tag creation."
        exit 1
    fi

    if [[ -n "${tag_name_override}" ]]; then
        tag_name="${tag_name_override}"
    else
        tag_name="v${build_version}"
    fi

    # Check if tag already exists
    if git rev-parse "${tag_name}" >/dev/null 2>&1; then
        printf '%s\n' "${build_name} tag ${tag_name} already exists. Skipping tag creation."
        return 0
    fi

    git config user.email "metamaskbot@users.noreply.github.com"
    git config user.name "MetaMask Bot"
    git tag -a "${tag_name}" "${target_sha}" -m "${build_name} version ${build_version}"
    git push "https://${GITHUB_TOKEN}@github.com/${GITHUB_REPOSITORY}" "${tag_name}"
    printf '%s\n' "${build_name} tag ${tag_name} created and pushed."
}

tag=""
target_sha="${RELEASE_SHA:-${GITHUB_SHA}}"
current_commit_msg=$(git show -s --format='%s' "${target_sha}")

if [[ -n "${RELEASE_TAG}" ]]; then
    if [[ "${RELEASE_TAG}" == v* ]]; then
        tag="${RELEASE_TAG}"
    else
        tag="v${RELEASE_TAG}"
    fi
elif [[ "${current_commit_msg}" =~ release/([[:digit:]]+\.[[:digit:]]+\.[[:digit:]]+) ]]; then
    tag="v${BASH_REMATCH[1]}"
fi

if [[ -z "${tag}" ]]; then
    printf '%s\n' 'Version not found in commit message or RELEASE_TAG; skipping GitHub Release'
    exit 0
fi

if gh release view "${tag}" >/dev/null 2>&1; then
    printf '%s\n' "Release ${tag} already exists. Skipping GitHub Release creation."
    exit 0
fi

flask_version=""
if [[ -z "${RELEASE_TAG}" ]]; then
    flask_version="$(print_build_version 'flask')"
    if [[ -z "${flask_version}" ]]; then
        echo "::error::Unable to determine Flask build version from ./build-flask-browserify/builds"
        exit 1
    fi
fi

printf '%s\n' 'Creating GitHub Release'
release_body="$(awk -v version="[${tag##v}]" -f .github/scripts/show-changelog.awk CHANGELOG.md)"
gh release create "${tag}" \
    build-dist-browserify/builds/metamask-chrome-*.zip \
    build-dist-mv2-browserify/builds/metamask-firefox-*.zip \
    build-flask-browserify/builds/metamask-flask-chrome-*.zip \
    build-flask-mv2-browserify/builds/metamask-flask-firefox-*.zip \
    --title "Version ${tag##v}" \
    --notes "${release_body}" \
    --target "${target_sha}"

if [[ -n "${RELEASE_TAG}" ]]; then
    echo "ℹ️ Explicit release mode detected; skipping Flask tag creation (handled elsewhere)."
else
    publish_tag 'Flask' "${flask_version}" "${target_sha}" "${FLASK_TAG:-}"
fi
