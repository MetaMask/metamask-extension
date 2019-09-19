#!/usr/bin/env bash

set -x
set -e
set -u
set -o pipefail

if [[ "${CI:-}" != 'true' ]]
then
    printf '%s\n' 'CI environment variable must be set to true'
    exit 1
fi

if [[ "${CIRCLECI:-}" != 'true' ]]
then
    printf '%s\n' 'CIRCLECI environment variable must be set to true'
    exit 1
fi

function install_github_cli ()
{
    printf '%s\n' 'Installing hub CLI'
    pushd "$(mktemp -d)"
        curl -sSL 'https://github.com/github/hub/releases/download/v2.11.2/hub-linux-amd64-2.11.2.tgz' | tar xz
        PATH="$PATH:$PWD/hub-linux-amd64-2.11.2/bin"
    popd
}

current_commit_msg=$(git show -s --format='%s' HEAD)

if [[ $current_commit_msg =~ Version[-[:space:]](v[[:digit:]]+.[[:digit:]]+.[[:digit:]]+) ]]
then
    tag="${BASH_REMATCH[1]}"

    install_github_cli

    printf '%s\n' 'Creating GitHub Release'
    release_body="$(awk -v version="${tag##v}" -f .circleci/scripts/show-changelog.awk CHANGELOG.md)"
    pushd builds
        hub release create \
            --attach metamask-chrome-*.zip \
            --attach metamask-firefox-*.zip \
            --message "Version ${tag##v}" \
            --message "$release_body" \
            --commitish "$CIRCLE_SHA1" \
            "$tag"
    popd
else
    printf '%s\n' 'Version not found in commit message; skipping GitHub Release'
    exit 0
fi
