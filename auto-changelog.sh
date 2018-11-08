#! /bin/bash
# update tags
git fetch --tags
# get origin
ORIGIN=$(git config --get remote.origin.url)
URL=$(echo $ORIGIN | sed -E 's/(.*).git{1}(.*)/\1/')
# get git logs from last tag until HEAD, pretty by 'subject::body' filtered by grep for PRs made with Github squash merge or Github regular merge
LOG=$(git log $(git describe --tags $(git rev-list --tags --max-count=1))..HEAD --pretty="%s::%b" --reverse --grep="Merge pull request #" --grep="(#");
while read -r line; do
    # get git log subject
    SUBJECT=$(echo $line | sed -E 's/(.*):{2}(.*)/\1/')
    # get git log PR id, PR made with Github squash merge or Github regular merge
    PR=$(echo $SUBJECT | sed 's/^.*(#\([^&]*\)).*/\1/' | sed 's/^.*#\([^&]*\) from.*/\1/')
    # if PR made with Github squash merge, subject is the body
    if [ -z "$(echo $line | sed -E 's/(.*):{2}(.*)/\2/')" ]; then
        BODY=$(echo $SUBJECT | sed "s/(#$PR)//g"); else
        BODY=$(echo $line | sed -E 's/(.*):{2}(.*)/\2/') 
    fi
    # add entry to CHANGELOG
    sed -i'' -e '/## Current Develop Branch/a\
- [#'"$PR"']('"$URL"'/pull/'"$PR"'): '"$BODY"''$'\n' CHANGELOG.md;
done <<< "$LOG"
echo 'CHANGELOG updated'
