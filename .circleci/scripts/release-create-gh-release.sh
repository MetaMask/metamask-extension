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

function print_flask_version ()
{
  local flask_filename
  flask_filename="$(find ./builds-flask -type f -name 'metamask-flask-chrome-*.zip' -exec basename {} .zip \;)"

  # Use substring parameter expansion to remove the first 22 characters ("metamask-extension-flask-")
  echo "${flask_filename:22}"
}

current_commit_msg=$(git show -s --format='%s' HEAD)

if [[ $current_commit_msg =~ Version[-[:space:]](v[[:digit:]]+.[[:digit:]]+.[[:digit:]]+) ]]
then
    tag="${BASH_REMATCH[1]}"
    flask_version="$(print_flask_version)"

    install_github_cli

    printf '%s\n' 'Creating GitHub Release'
    release_body="$(awk -v version="${tag##v}" -f .circleci/scripts/show-changelog.awk CHANGELOG.md)"
    hub release create \
        --attach builds/metamask-chrome-*.zip \
        --attach builds/metamask-firefox-*.zip \
        --attach builds-flask/metamask-flask-chrome-*.zip \
        --attach builds-flask/metamask-flask-firefox-*.zip \
        --message "Version ${tag##v}" \
        --message "$release_body" \
        --commitish "$CIRCLE_SHA1" \
        "$tag"
    git tag -a "v${flask_version}" -m "Flask version ${flask_version}"
else
    printf '%s\n' 'Version not found in commit message; skipping GitHub Release'
    exit 0
fi
