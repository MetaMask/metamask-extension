#!/usr/bin/env bash

# Creates a GitHub Release for a given tag.
# Tags must be created separately (via create-release-tag.sh).
#
# Required environment variables:
#   GITHUB_TOKEN - GitHub token for creating releases
#   RELEASE_TAG - Tag name (e.g., v12.5.0)
#   RELEASE_SHA - Target SHA for the release

set -e
set -o pipefail

if [[ -z "${GITHUB_TOKEN}" ]]; then
    echo "::error::GITHUB_TOKEN not provided."
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

# Check if release already exists (idempotency)
if gh release view "${tag}" >/dev/null 2>&1; then
    printf '%s\n' "Release ${tag} already exists. Skipping GitHub Release creation."
    exit 0
fi

printf '%s\n' "Creating GitHub Release for ${tag} at ${RELEASE_SHA:0:7}"
release_body="$(awk -v version="[${tag##v}]" -f .github/scripts/show-changelog.awk CHANGELOG.md)"
gh release create "${tag}" \
    build-dist-browserify/builds/metamask-chrome-*.zip \
    build-dist-mv2-browserify/builds/metamask-firefox-*.zip \
    build-flask-browserify/builds/metamask-flask-chrome-*.zip \
    build-flask-mv2-browserify/builds/metamask-flask-firefox-*.zip \
    --title "Version ${tag##v}" \
    --notes "${release_body}" \
    --target "${RELEASE_SHA}"

printf '%s\n' "✅ GitHub Release ${tag} created successfully"
