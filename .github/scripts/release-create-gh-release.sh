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
    local tag_name="v${build_version}"

    # 1. Check if tag already exists via API
    if gh api "/repos/${GITHUB_REPOSITORY}/git/refs/tags/${tag_name}" >/dev/null 2>&1; then
        printf '%s\n' "${build_name} tag ${tag_name} already exists. Skipping tag creation."
        return 0
    fi

    # 2. Prepare tagger metadata (must match existing "MetaMask Bot" attribution)
    local tag_date
    tag_date=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

    # 3. Create annotated tag object via API
    # Use jq to construct JSON safely (handles special characters in build_name)
    local tag_payload
    tag_payload=$(jq -n \
        --arg tag "$tag_name" \
        --arg message "${build_name} version ${build_version}" \
        --arg object "$GITHUB_SHA" \
        --arg email "metamaskbot@users.noreply.github.com" \
        --arg date "$tag_date" \
        '{
            tag: $tag,
            message: $message,
            object: $object,
            type: "commit",
            tagger: {
                name: "MetaMask Bot",
                email: $email,
                date: $date
            }
        }')

    local tag_sha
    tag_sha=$(echo "$tag_payload" | gh api \
        --method POST \
        "/repos/${GITHUB_REPOSITORY}/git/tags" \
        --input - \
        --jq '.sha')

    if [[ -z "${tag_sha}" ]]; then
        printf 'Error: Failed to create tag object for %s\n' "${tag_name}" >&2
        return 1
    fi

    # 4. Create the ref (this effectively "pushes" the tag)
    gh api \
        --method POST \
        "/repos/${GITHUB_REPOSITORY}/git/refs" \
        -f ref="refs/tags/${tag_name}" \
        -f sha="${tag_sha}"

    printf '%s\n' "${build_name} tag ${tag_name} created successfully via API."
}

current_commit_msg=$(git show -s --format='%s' HEAD)

if [[ "${current_commit_msg}" =~ release/([[:digit:]]+\.[[:digit:]]+\.[[:digit:]]+) ]]; then
    tag="v${BASH_REMATCH[1]}"
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
