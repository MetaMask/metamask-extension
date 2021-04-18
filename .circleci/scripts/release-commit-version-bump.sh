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

printf '%s\n' 'Commit the manifest version and changelog if the manifest has changed'

if git diff --quiet app/manifest/_base.json;
then
    printf '%s\n' 'No manifest changes to commit'
    exit 0
fi

git \
    -c user.name='MetaMask Bot' \
    -c user.email='metamaskbot@users.noreply.github.com' \
    commit --message "${CIRCLE_BRANCH/-/ }" \
        CHANGELOG.md app/manifest/_base.json

repo_slug="$CIRCLE_PROJECT_USERNAME/$CIRCLE_PROJECT_REPONAME"
git push "https://$GITHUB_TOKEN_USER:$GITHUB_TOKEN@github.com/$repo_slug" "$CIRCLE_BRANCH"
