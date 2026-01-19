#!/usr/bin/env bash

# Creates release tags and GitHub Release in a single operation.
# Both operations are idempotent - safe to retry on failure.
#
# Required environment variables:
#   GITHUB_TOKEN - GitHub token for tag push and release creation
#   GITHUB_REPOSITORY - Repository in format owner/repo
#   RELEASE_TAG - Main release tag name (e.g., v12.5.0)
#   RELEASE_SHA - Target SHA for the tag and release
#
# Optional environment variables:
#   FLASK_TAG - Flask tag name (e.g., v12.5.0-flask.0), created if provided

set -e
set -o pipefail

if [[ -z "${GITHUB_TOKEN}" ]]; then
    echo "::error::GITHUB_TOKEN not provided."
    exit 1
fi

if [[ -z "${GITHUB_REPOSITORY}" ]]; then
    echo "::error::GITHUB_REPOSITORY not provided."
    exit 1
fi

if [[ -z "${RELEASE_TAG}" ]]; then
    echo "::error::RELEASE_TAG not provided."
    exit 1
fi

if [[ -z "${RELEASE_SHA}" ]]; then
    echo "::error::RELEASE_SHA not provided."
    exit 1
fi

# Normalize tag to include 'v' prefix
tag=""
if [[ "${RELEASE_TAG}" == v* ]]; then
    tag="${RELEASE_TAG}"
else
    tag="v${RELEASE_TAG}"
fi

VERSION="${tag#v}"

echo "=== Release Creation ==="
echo "Tag: ${tag}"
echo "SHA: ${RELEASE_SHA}"

git config user.email "metamaskbot@users.noreply.github.com"
git config user.name "MetaMask Bot"

# Function to create and push a tag with idempotency
publish_tag() {
    local tag_name="${1}"
    local target_sha="${2}"
    local tag_message="${3}"

    echo ""
    echo "Checking tag: ${tag_name}"

    # Check if tag already exists
    if git rev-parse "${tag_name}" >/dev/null 2>&1; then
        local existing_sha
        existing_sha=$(git rev-parse "${tag_name}^{}")

        if [[ "${existing_sha}" == "${target_sha}" ]]; then
            printf '%s\n' "✅ Tag ${tag_name} already exists at correct SHA (${target_sha:0:7}). Skipping."
            return 0
        else
            echo "::error::Tag ${tag_name} exists at different SHA!"
            echo "::error::  Expected: ${target_sha:0:7}"
            echo "::error::  Actual:   ${existing_sha:0:7}"
            echo "::error::This indicates a version conflict. Cannot proceed."
            return 1
        fi
    fi

    # Tag doesn't exist, create it
    echo "Creating tag ${tag_name} at ${target_sha:0:7}..."
    git tag -a "${tag_name}" "${target_sha}" -m "${tag_message}"
    git push "https://${GITHUB_TOKEN}@github.com/${GITHUB_REPOSITORY}" "${tag_name}"
    printf '%s\n' "✅ Tag ${tag_name} created and pushed successfully"
}

# Create main release tag
publish_tag "${tag}" "${RELEASE_SHA}" "Release ${VERSION}"

# Create Flask tag if specified
if [[ -n "${FLASK_TAG}" ]]; then
    publish_tag "${FLASK_TAG}" "${RELEASE_SHA}" "Flask release ${FLASK_TAG#v}"
fi

echo ""
echo "=== Creating GitHub Release ==="

# Check if release already exists (idempotency)
if gh release view "${tag}" >/dev/null 2>&1; then
    printf '%s\n' "✅ Release ${tag} already exists. Skipping GitHub Release creation."
    exit 0
fi

printf '%s\n' "Creating GitHub Release for ${tag}..."

# Validate artifacts exist (fail fast with clear error)
for artifact in build-dist-browserify/builds/metamask-chrome-*.zip \
                build-dist-mv2-browserify/builds/metamask-firefox-*.zip \
                build-flask-browserify/builds/metamask-flask-chrome-*.zip \
                build-flask-mv2-browserify/builds/metamask-flask-firefox-*.zip; do
    # shellcheck disable=SC2086
    if ! ls $artifact >/dev/null 2>&1; then
        echo "::error::Required artifact not found: ${artifact}"
        exit 1
    fi
done

release_body="$(awk -v version="[${VERSION}]" -f .github/scripts/show-changelog.awk CHANGELOG.md)"
gh release create "${tag}" \
    build-dist-browserify/builds/metamask-chrome-*.zip \
    build-dist-mv2-browserify/builds/metamask-firefox-*.zip \
    build-flask-browserify/builds/metamask-flask-chrome-*.zip \
    build-flask-mv2-browserify/builds/metamask-flask-firefox-*.zip \
    --title "Version ${VERSION}" \
    --notes "${release_body}" \
    --target "${RELEASE_SHA}"

printf '%s\n' "✅ GitHub Release ${tag} created successfully"
