#!/usr/bin/env bash

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

version="${CIRCLE_BRANCH/Version-v/}"
base_branch='stable'

if [[ -n "${CI_PULL_REQUEST:-}" ]]
then
    printf '%s\n' 'CI_PULL_REQUEST is set, pull request already exists for this build'
    exit 0
fi

install_github_cli

printf '%s\n' "Creating a Pull Request for $version on GitHub"

if ! hub pull-request \
    --draft \
    --message "${CIRCLE_BRANCH/-/ } RC" --message ':package: :rocket:' \
    --base "$CIRCLE_PROJECT_USERNAME:$base_branch" \
    --head "$CIRCLE_PROJECT_USERNAME:$CIRCLE_BRANCH";
then
    printf '%s\n' 'Pull Request already exists'
fi
