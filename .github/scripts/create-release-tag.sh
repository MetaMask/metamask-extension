#!/usr/bin/env bash

# Creates release tags with idempotency checks.
# - If tag exists at same SHA → skip (success)
# - If tag exists at different SHA → fail
# - If tag doesn't exist → create and push
#
# Required environment variables:
#   GITHUB_TOKEN - GitHub token for authenticated push
#   GITHUB_REPOSITORY - Repository in format owner/repo
#   RELEASE_TAG - Tag name (e.g., v12.5.0)
#   RELEASE_SHA - Target SHA for the tag
#   DRY_RUN - If "true", skip actual tag creation
#
# Optional environment variables:
#   FLASK_TAG - Flask tag name (e.g., v12.5.0-flask.0), created if provided

set -e
set -o pipefail

# Validate required environment variables
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

echo "=== Release Tag Creation ==="
echo "Tag: ${RELEASE_TAG}"
echo "SHA: ${RELEASE_SHA}"
echo "Dry run: ${DRY_RUN:-false}"

# Configure git (skip in dry-run to avoid mutating .git/config)
if [[ "${DRY_RUN}" != "true" ]]; then
    git config user.email "metamaskbot@users.noreply.github.com"
    git config user.name "MetaMask Bot"
fi

# Track whether a new tag was created in this run.
tag_created="false"

# Function to check and create a tag
create_tag_if_needed() {
    local tag_name="${1}"
    local target_sha="${2}"
    local tag_message="${3}"

    echo ""
    echo "Checking tag: ${tag_name}"

    # Check if tag exists
    if git rev-parse "${tag_name}" >/dev/null 2>&1; then
        local existing_sha
        existing_sha=$(git rev-parse "${tag_name}^{}")

        if [[ "${existing_sha}" == "${target_sha}" ]]; then
            echo "✅ Tag ${tag_name} already exists at correct SHA (${target_sha:0:7})"
            echo "   Skipping tag creation."
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
    if [[ "${DRY_RUN}" == "true" ]]; then
        echo "🔸 DRY RUN: Would create tag ${tag_name} at ${target_sha:0:7}"
        echo "   Message: ${tag_message}"
    else
        echo "Creating tag ${tag_name} at ${target_sha:0:7}..."
        if ! git tag -a "${tag_name}" "${target_sha}" -m "${tag_message}"; then
            echo "::error::Failed to create tag ${tag_name} at ${target_sha:0:7}"
            return 1
        fi

        echo "Pushing tag to origin..."
        if ! git push "https://${GITHUB_TOKEN}@github.com/${GITHUB_REPOSITORY}" "${tag_name}"; then
            echo "::error::Failed to push tag ${tag_name} to origin"
            return 1
        fi

        echo "✅ Tag ${tag_name} created and pushed successfully"
        tag_created="true"
    fi
}

# Create main release tag
VERSION="${RELEASE_TAG#v}"
main_tag_result=0
flask_tag_result=0

# Temporarily disable errexit so we can capture both results.
set +e
create_tag_if_needed "${RELEASE_TAG}" "${RELEASE_SHA}" "Release ${VERSION}"
main_tag_result=$?

# Fail fast on main tag conflict before attempting Flask tag creation.
if [[ ${main_tag_result} -ne 0 ]]; then
    set -e
    exit 1
fi

# Create Flask tag if specified
if [[ -n "${FLASK_TAG}" ]]; then
    create_tag_if_needed "${FLASK_TAG}" "${RELEASE_SHA}" "Flask version ${FLASK_TAG#v}"
    flask_tag_result=$?
fi
set -e

# Exit with error if any tag creation failed
if [[ ${main_tag_result} -ne 0 ]] || [[ ${flask_tag_result} -ne 0 ]]; then
    exit 1
fi

if [[ -n "${GITHUB_OUTPUT:-}" ]]; then
    echo "tag_created=${tag_created}" >> "${GITHUB_OUTPUT}"
fi

echo ""
echo "=== Tag Creation Complete ==="
