#!/usr/bin/env bash

set -e
set -u
set -o pipefail

readonly URL='https://github.com/MetaMask/metamask-extension'

git fetch --tags

most_recent_tag="$(git describe --tags "$(git rev-list --tags --max-count=1)")"

git rev-list "${most_recent_tag}"..HEAD | while read commit
do
    subject="$(git show -s --format="%s" "$commit")"

    # Squash & Merge: the commit subject is parsed as `<description> (#<PR ID>)`
    if grep -E -q '\(#[[:digit:]]+\)' <<< "$subject"
    then
        pr="$(awk '{print $NF}' <<< "$subject" | tr -d '()')"
        prefix="[$pr]($URL/pull/${pr###}): "
        description="$(awk '{NF--; print $0}' <<< "$subject")"

    # Merge: the PR ID is parsed from the git subject (which is of the form `Merge pull request
    #   #<PR ID> from <branch>`, and the description is assumed to be the first line of the body.
    #   If no body is found, the description is set to the commit subject
    elif grep -E -q '#[[:digit:]]+\sfrom' <<< "$subject"
    then
        pr="$(awk '{print $4}' <<< "$subject")"
        prefix="[$pr]($URL/pull/${pr###}): "

        first_line_of_body="$(git show -s --format="%b" "$commit" | head -n 1 | tr -d '\r')"
        if [[ -z "$first_line_of_body" ]]
        then
            description="$subject"
        else
            description="$first_line_of_body"
        fi

    # Normal commits: The commit subject is the description, and the PR ID is omitted.
    else
        pr=''
        prefix=''
        description="$subject"
    fi

    # add entry to CHANGELOG
    if [[ "$OSTYPE" == "linux-gnu" ]]
    then
        # shellcheck disable=SC1004
        sed -i'' '/## Current Develop Branch/a\
- '"$prefix$description"''$'\n' CHANGELOG.md
    else
        # shellcheck disable=SC1004
        sed -i '' '/## Current Develop Branch/a\
- '"$prefix$description"''$'\n' CHANGELOG.md
    fi
done

echo 'CHANGELOG updated'
