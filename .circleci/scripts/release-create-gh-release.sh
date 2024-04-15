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

function print_build_version ()
{
  local build_type="${1}"; shift

  local filename
  filename="$(find "./builds-${build_type}" -type f -name "metamask-${build_type}-chrome-*.zip" -exec basename {} .zip \;)"

  local build_filename_prefix
  build_filename_prefix="metamask-${build_type}-chrome-"
  local build_filename_prefix_size
  build_filename_prefix_size="${#build_filename_prefix}"

  # Use substring parameter expansion to remove the filename prefix, leaving just the version
  echo "${filename:$build_filename_prefix_size}"
}


function publish_tag ()
{
    local build_name="${1}"; shift
    local build_version="${1}"; shift

    git config user.email "metamaskbot@users.noreply.github.com"
    git config user.name "MetaMask Bot"
    git tag -a "v${build_version}" -m "${build_name} version ${build_version}"
    repo_slug="$CIRCLE_PROJECT_USERNAME/$CIRCLE_PROJECT_REPONAME"
    git push "https://$GITHUB_TOKEN@github.com/$repo_slug" "v${build_version}"
}

current_commit_msg=$(git show -s --format='%s' HEAD)

if [[ $current_commit_msg =~ Version[-[:space:]](v[[:digit:]]+.[[:digit:]]+.[[:digit:]]+) ]]
then
    tag="${BASH_REMATCH[1]}"
    flask_version="$(print_build_version 'flask')"
    mmi_version="$(print_build_version 'mmi')"

    install_github_cli

    printf '%s\n' 'Creating GitHub Release'
    release_body="$(awk -v version="${tag##v}" -f .circleci/scripts/show-changelog.awk CHANGELOG.md)"
    hub release create \
        --attach builds/metamask-chrome-*.zip \
        --attach builds/metamask-firefox-*.zip \
        --attach builds-flask/metamask-flask-chrome-*.zip \
        --attach builds-flask/metamask-flask-firefox-*.zip \
        --attach builds-mmi/metamask-mmi-chrome-*.zip \
        --attach builds-mmi/metamask-mmi-firefox-*.zip \
        --message "Version ${tag##v}" \
        --message "$release_body" \
        --commitish "$CIRCLE_SHA1" \
        "$tag"

    publish_tag 'Flask' "${flask_version}"
    publish_tag 'MMI' "${mmi_version}"
else
    printf '%s\n' 'Version not found in commit message; skipping GitHub Release'
    exit 0
fi
