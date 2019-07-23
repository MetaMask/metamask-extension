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

version="${CIRCLE_BRANCH/Version-v/}"

if ! grep --quiet --fixed-strings "$version" CHANGELOG.md
then
    printf '%s\n' 'Adding this release to CHANGELOG.md'
    date_str="$(date '+%a %b %d %Y')"
    cp CHANGELOG.md{,.bak}

update_headers=$(cat <<END
/## Current Develop Branch/ {
    print "## Current Develop Branch\n";
    print "## ${version} ${date_str}";
    next;
}
{
    print;
}
END
)

    awk "$update_headers" CHANGELOG.md.bak > CHANGELOG.md
    rm CHANGELOG.md.bak
else
    printf '%s\n' "CHANGELOG.md already includes a header for ${version}"
    exit 0
fi
