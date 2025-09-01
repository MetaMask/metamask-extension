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

# Validate commit message format to prevent injection
# Matches "Version v12.0.0" or "Version-v12.0.0" at the start of the message
if [[ "${current_commit_msg}" =~ ^Version( |-)(v[0-9]+\.[0-9]+\.[0-9]+) ]]; then
    tag="${BASH_REMATCH[2]}"
    # Additional validation of extracted tag
    if ! [[ "${tag}" =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
        printf '%s\n' "::error::Invalid tag format extracted from commit message"
        exit 1
    fi
    flask_version="$(print_build_version 'flask')"

        # Check if the tag already exists (it should have been created on the release branch)
    if git rev-parse "${tag}" >/dev/null 2>&1; then
        printf '%s\n' "Tag ${tag} already exists (created on release branch)"
        tag_sha=$(git rev-parse "${tag}")
        printf '%s\n' "Tag SHA: ${tag_sha}"

        # Verify the tag is in the current commit's history (not just floating)
        if git merge-base --is-ancestor "${tag_sha}" HEAD; then
            printf '%s\n' "✅ Tag ${tag} is in the current branch history"
        else
            printf '%s\n' "⚠️  WARNING: Tag ${tag} exists but is not in the current branch history!"
            printf '%s\n' "This may indicate the tag was not created properly on the release branch."
            printf '%s\n' "Please verify the release process was followed correctly."
        fi

        # Check if GitHub release already exists
        if gh release view "${tag}" >/dev/null 2>&1; then
            printf '%s\n' "GitHub release ${tag} already exists; skipping creation"
        else
            printf '%s\n' 'Creating GitHub Release at existing tag'
            release_body="$(awk -v version="[${tag##v}]" -f .github/scripts/show-changelog.awk CHANGELOG.md)"

            # Create release at the existing tag (not at current SHA)
            gh release create "${tag}" \
                build-dist-browserify/builds/metamask-chrome-*.zip \
                build-dist-mv2-browserify/builds/metamask-firefox-*.zip \
                build-flask-browserify/builds/metamask-flask-chrome-*.zip \
                build-flask-mv2-browserify/builds/metamask-flask-firefox-*.zip \
                --title "Version ${tag##v}" \
                --notes "${release_body}" \
                --target "${tag_sha}"
        fi
    else
        # Fallback: Create tag if it doesn't exist (shouldn't happen with new process)
        printf '%s\n' "⚠️  WARNING: Tag ${tag} not found!"
        printf '%s\n' "This indicates the 'Tag Release Branch' workflow was not run before merge."
        printf '%s\n' "Creating tag now at merge commit (not recommended - should tag release branch instead)"
        printf '%s\n' ""
        printf '%s\n' "To avoid this in the future:"
        printf '%s\n' "1. Run 'Tag Release Branch' workflow BEFORE merging the release PR"
        printf '%s\n' "2. This ensures the tag points to the tested release branch code"
        printf '%s\n' ""

        git config user.email "metamaskbot@users.noreply.github.com"
        git config user.name "MetaMask Bot"
        git tag -a "${tag}" -m "Version ${tag##v}" "${GITHUB_SHA}"
        git push "https://${GITHUB_TOKEN}@github.com/${GITHUB_REPOSITORY}" "${tag}"

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
    fi

    # Handle Flask tagging
    if git rev-parse "v${flask_version}" >/dev/null 2>&1; then
        printf '%s\n' "Flask tag v${flask_version} already exists"
    else
        publish_tag 'Flask' "${flask_version}"
    fi
else
    printf '%s\n' 'Version not found in commit message; skipping GitHub Release'
    exit 0
fi
