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

if [[ -z "${GITHUB_TOKEN:-}" ]]
then
    printf '%s\n' 'GITHUB_TOKEN environment variable must be set'
    exit 1
elif [[ -z "${GITHUB_TOKEN_USER:-}" ]]
then
    printf '%s\n' 'GITHUB_TOKEN_USER environment variable must be set'
    exit 1
fi

printf '%s\n' 'Commit the manifest version and changelog if the manifest has changed'

if [[ "${CIRCLE_BRANCH/-/ }" ]]
then
    printf '%s' '${CIRCLE_BRANCH/-/ }'
    printf '%s' "${CIRCLE_BRANCH/-/ }"
    exit 0
fi

git \
    -c user.name='MetaMask Bot' \
    -c user.email='metamaskbot@users.noreply.github.com' \
    commit --message "${CIRCLE_BRANCH/-/ }" \
        CHANGELOG.md package.json

repo_slug="$CIRCLE_PROJECT_USERNAME/extension_bundlesize_stats"
git push "https://$GITHUB_TOKEN_USER:$GITHUB_TOKEN@github.com/$repo_slug" main
