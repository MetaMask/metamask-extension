#!/bin/env bash

set -e
set -u
set -o pipefail

readonly URL='https://github.com/MetaMask/metamask-extension'

git fetch --tags

most_recent_tag="$(git describe --tags "$(git rev-list --tags --max-count=1)")"

readarray -t commits <<< "$(git rev-list "${most_recent_tag}"..HEAD)"

for commit in "${commits[@]}"
do
    subject="$(git show -s --format="%s" "$commit")"

    # Gets PR id embedded in commit subject, for PRs merged with Github squash merge or regular merge
    if grep -E -q '\(#[[:digit:]]+\)|#[[:digit:]]+\sfrom' <<< "$subject"
    then
        # shellcheck disable=SC2001
        pr="$(printf "%s" "$subject" | sed 's/^.*#\([[:digit:]]\+\).*$/\1/')"
        prefix="[#$pr]($URL/pull/$pr): "
    else
        pr=''
        prefix=''
    fi

    body="$(git show -s --format="%b" "$commit" | head -n 1 | tr -d '\r')"
    if [[ -z "$body" ]]
    then
        # shellcheck disable=SC2001
        body="$(printf "%s" "$subject" | sed "s/\s*(#$pr)//g")"
    fi

    # add entry to CHANGELOG
    if [[ "$OSTYPE" == "linux-gnu" ]]
    then
        # shellcheck disable=SC1004
        sed -i'' '/## Current Develop Branch/a\
- '"$prefix$body"''$'\n' CHANGELOG.md
    else
        # shellcheck disable=SC1004
        sed -i '' '/## Current Develop Branch/a\
- '"$prefix$body"''$'\n' CHANGELOG.md
    fi
done

echo 'CHANGELOG updated'
