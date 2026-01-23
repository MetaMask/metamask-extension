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

# Function to create and push a tag with idempotency via GitHub API.
# Uses API instead of git push to avoid GITHUB_TOKEN scope issues.
publish_tag() {
    local tag_name="${1}"
    local target_sha="${2}"
    local tag_message="${3}"

    echo ""
    echo "Checking tag: ${tag_name}"

    # 1. Check if tag already exists via API
    local existing_ref
    existing_ref=$(gh api "/repos/${GITHUB_REPOSITORY}/git/refs/tags/${tag_name}" 2>/dev/null || true)

    if [[ -n "${existing_ref}" ]]; then
        # Tag exists - verify SHA matches (idempotency check)
        local existing_tag_sha
        existing_tag_sha=$(echo "${existing_ref}" | jq -r '.object.sha')

        # If it's an annotated tag, dereference to get the commit SHA
        local object_type
        object_type=$(echo "${existing_ref}" | jq -r '.object.type')

        if [[ "${object_type}" == "tag" ]]; then
            # Dereference annotated tag to get commit SHA
            existing_tag_sha=$(gh api "/repos/${GITHUB_REPOSITORY}/git/tags/${existing_tag_sha}" --jq '.object.sha' 2>/dev/null || echo "${existing_tag_sha}")
        fi

        if [[ "${existing_tag_sha}" == "${target_sha}" ]]; then
            printf '%s\n' "✅ Tag ${tag_name} already exists at correct SHA (${target_sha:0:7}). Skipping."
            return 0
        else
            echo "::error::Tag ${tag_name} exists at different SHA!"
            echo "::error::  Expected: ${target_sha:0:7}"
            echo "::error::  Actual:   ${existing_tag_sha:0:7}"
            echo "::error::This indicates a version conflict. Cannot proceed."
            return 1
        fi
    fi

    # 2. Prepare tagger metadata (must match existing "MetaMask Bot" attribution)
    local tag_date
    tag_date=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

    # 3. Create annotated tag object via API
    # Use jq to construct JSON safely (handles special characters)
    echo "Creating tag ${tag_name} at ${target_sha:0:7}..."
    local tag_payload
    tag_payload=$(jq -n \
        --arg tag "$tag_name" \
        --arg message "${tag_message}" \
        --arg object "$target_sha" \
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
        echo "::error::Failed to create tag object for ${tag_name}"
        return 1
    fi

    # 4. Create the ref (this effectively "pushes" the tag)
    if ! gh api \
        --method POST \
        "/repos/${GITHUB_REPOSITORY}/git/refs" \
        -f ref="refs/tags/${tag_name}" \
        -f sha="${tag_sha}"; then
        echo "::error::Failed to create ref for tag ${tag_name}"
        return 1
    fi

    printf '%s\n' "✅ Tag ${tag_name} created successfully via API."
}

# Create main release tag
publish_tag "${tag}" "${RELEASE_SHA}" "Release ${VERSION}"

# Create Flask tag if specified
if [[ -n "${FLASK_TAG}" ]]; then
    publish_tag "${FLASK_TAG}" "${RELEASE_SHA}" "Flask release ${FLASK_TAG#v}"
fi

echo ""
echo "=== Creating GitHub Release ==="

# Check if release already exists (idempotency + SHA verification)
existing_target=$(gh release view "${tag}" --json targetCommitish --jq .targetCommitish 2>/dev/null || true)
if [[ -n "${existing_target}" ]]; then
    if [[ "${existing_target}" == "${RELEASE_SHA}" ]]; then
        printf '%s\n' "✅ Release ${tag} already exists at correct SHA (${RELEASE_SHA:0:7}). Skipping."
        exit 0
    else
        echo "::error::Release ${tag} exists at different SHA!"
        echo "::error::  Expected: ${RELEASE_SHA:0:7}"
        echo "::error::  Actual:   ${existing_target:0:7}"
        echo "::error::This indicates a version conflict. Cannot proceed."
        exit 1
    fi
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
